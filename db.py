"""
db.py — SQLite persistence layer for Nexus Battle
Handles: game sessions, player sessions (rejoin tokens), leaderboard history
"""

import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'game.db')

# ── Connection helper ──────────────────────────────────────────────────────
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # Better concurrency
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

# ── Schema Init ────────────────────────────────────────────────────────────
def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS game_sessions (
                room_code     TEXT PRIMARY KEY,
                concept       TEXT NOT NULL,
                state         TEXT NOT NULL DEFAULT 'lobby',
                turn_index    INTEGER NOT NULL DEFAULT 0,
                round_count   INTEGER NOT NULL DEFAULT 0,
                host_name     TEXT,
                tied_params   TEXT NOT NULL DEFAULT '[]',
                leaderboard_shown_for_round INTEGER NOT NULL DEFAULT 0,
                cards_per_player INTEGER NOT NULL DEFAULT 0,
                max_rounds    INTEGER NOT NULL DEFAULT 0,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS player_sessions (
                session_token TEXT PRIMARY KEY,
                room_code     TEXT NOT NULL,
                player_name   TEXT NOT NULL,
                is_host       INTEGER NOT NULL DEFAULT 0,
                cards         TEXT NOT NULL DEFAULT '[]',
                score_count   INTEGER NOT NULL DEFAULT 0,
                seat_index    INTEGER NOT NULL DEFAULT 0,
                connected     INTEGER NOT NULL DEFAULT 1,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_code) REFERENCES game_sessions(room_code) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS leaderboard_history (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                room_code     TEXT NOT NULL,
                round_number  INTEGER NOT NULL,
                player_name   TEXT NOT NULL,
                score         INTEGER NOT NULL DEFAULT 0,
                card_count    INTEGER NOT NULL DEFAULT 0,
                recorded_at   DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_player_room
                ON player_sessions(room_code);

            CREATE INDEX IF NOT EXISTS idx_lb_room
                ON leaderboard_history(room_code, round_number);
        """)

        # Migration helper for existing databases
        for col_def in ["cards_per_player INTEGER NOT NULL DEFAULT 0", "max_rounds INTEGER NOT NULL DEFAULT 0"]:
            try:
                conn.execute(f"ALTER TABLE game_sessions ADD COLUMN {col_def}")
            except Exception:
                pass  # Column already exists

    print("[DB] Initialized database at", DB_PATH)

# ── Game Session ───────────────────────────────────────────────────────────
def save_game_session(room_code: str, room_data: dict):
    """Upsert the full game session state (called after every state change)."""
    host_name = None
    for p in room_data.get('players', []):
        if p.get('isHost'):
            host_name = p.get('name')
            break
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO game_sessions
                (room_code, concept, state, turn_index, round_count, host_name,
                 tied_params, leaderboard_shown_for_round, cards_per_player, max_rounds, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(room_code) DO UPDATE SET
                state         = excluded.state,
                turn_index    = excluded.turn_index,
                round_count   = excluded.round_count,
                host_name     = excluded.host_name,
                tied_params   = excluded.tied_params,
                leaderboard_shown_for_round = excluded.leaderboard_shown_for_round,
                cards_per_player = excluded.cards_per_player,
                max_rounds    = excluded.max_rounds,
                updated_at    = CURRENT_TIMESTAMP
        """, (
            room_code,
            room_data.get('concept', 'ben10'),
            room_data.get('state', 'lobby'),
            room_data.get('turn_index', 0),
            room_data.get('round_count', 0),
            host_name,
            json.dumps(room_data.get('tied_parameters', [])),
            room_data.get('leaderboard_shown_for_round', 0),
            room_data.get('cards_per_player', 0),
            room_data.get('max_rounds', 0),
        ))

def delete_game_session(room_code: str):
    """Remove a finished/empty game room from DB."""
    with get_conn() as conn:
        conn.execute("DELETE FROM game_sessions WHERE room_code = ?", (room_code,))

def load_all_game_sessions() -> dict:
    """
    Restore the in-memory `rooms` dict from DB on server startup.
    Returns a dict keyed by room_code.
    Players are loaded separately via load_players_for_room().
    """
    rooms = {}
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM game_sessions WHERE state != 'finished'"
        ).fetchall()
        for row in rows:
            room_code = row['room_code']
            players = load_players_for_room(room_code)
            # Only restore if there's at least one player
            if not players:
                continue
            # Find host sid — will be None until they reconnect
            host_name = row['host_name']
            host_sid = None
            for p in players:
                if p.get('name') == host_name:
                    host_sid = p.get('id')  # Will be None until reconnected
                    break
            rooms[room_code] = {
                'concept':  row['concept'],
                'state':    row['state'],
                'players':  players,
                'host_sid': host_sid,
                'turn_index':  row['turn_index'],
                'round_count': row['round_count'],
                'tied_parameters': json.loads(row['tied_params'] or '[]'),
                'leaderboard_shown_for_round': row['leaderboard_shown_for_round'],
                'cards_per_player': row['cards_per_player'] if 'cards_per_player' in row.keys() else 0,
                'max_rounds': row['max_rounds'] if 'max_rounds' in row.keys() else 0,
            }
    print(f"[DB] Restored {len(rooms)} active game session(s) from DB")
    return rooms

# ── Player Session ─────────────────────────────────────────────────────────
def save_player_session(token: str, room_code: str, player_data: dict, seat_index: int):
    """Upsert a player's session by their token."""
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO player_sessions
                (session_token, room_code, player_name, is_host, cards,
                 score_count, seat_index, connected, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(session_token) DO UPDATE SET
                room_code    = excluded.room_code,
                player_name  = excluded.player_name,
                is_host      = excluded.is_host,
                cards        = excluded.cards,
                score_count  = excluded.score_count,
                seat_index   = excluded.seat_index,
                connected    = 1,
                updated_at   = CURRENT_TIMESTAMP
        """, (
            token,
            room_code,
            player_data.get('name', ''),
            1 if player_data.get('isHost') else 0,
            json.dumps(player_data.get('cards', [])),
            player_data.get('score_count', 0),
            seat_index,
        ))

def mark_player_disconnected(token: str):
    """Mark a player as disconnected (grace period — not yet deleted)."""
    with get_conn() as conn:
        conn.execute("""
            UPDATE player_sessions
               SET connected = 0, updated_at = CURRENT_TIMESTAMP
             WHERE session_token = ?
        """, (token,))

def get_player_session(token: str) -> dict | None:
    """Fetch a player's saved session by token. Returns None if not found."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM player_sessions WHERE session_token = ?", (token,)
        ).fetchone()
        if not row:
            return None
        return {
            'session_token': row['session_token'],
            'room_code':     row['room_code'],
            'player_name':   row['player_name'],
            'is_host':       bool(row['is_host']),
            'cards':         json.loads(row['cards'] or '[]'),
            'score_count':   row['score_count'],
            'seat_index':    row['seat_index'],
        }

def delete_player_session(token: str):
    """Hard-delete a player's session (voluntary leave or grace period expired)."""
    with get_conn() as conn:
        conn.execute("DELETE FROM player_sessions WHERE session_token = ?", (token,))

def load_players_for_room(room_code: str) -> list:
    """Load all players for a room ordered by seat_index (for turn order restore)."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM player_sessions WHERE room_code = ? ORDER BY seat_index",
            (room_code,)
        ).fetchall()
        players = []
        for row in rows:
            players.append({
                'id':          None,          # Socket SID — assigned on reconnect
                'name':        row['player_name'],
                'isHost':      bool(row['is_host']),
                'cards':       json.loads(row['cards'] or '[]'),
                'score_count': row['score_count'],
                'session_token': row['session_token'],
                'connected':   bool(row['connected']),
            })
        return players

def get_token_for_player_in_room(room_code: str, player_name: str) -> str | None:
    """Find a token by room + name (used to link socket sessions to DB records)."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT session_token FROM player_sessions WHERE room_code=? AND player_name=?",
            (room_code, player_name)
        ).fetchone()
        return row['session_token'] if row else None

# ── Leaderboard History ────────────────────────────────────────────────────
def save_leaderboard_snapshot(room_code: str, round_number: int, leaderboard: list):
    """Record a leaderboard snapshot at each round milestone."""
    with get_conn() as conn:
        # Remove existing entries for this round to allow re-saves
        conn.execute(
            "DELETE FROM leaderboard_history WHERE room_code=? AND round_number=?",
            (room_code, round_number)
        )
        conn.executemany("""
            INSERT INTO leaderboard_history
                (room_code, round_number, player_name, score, card_count)
            VALUES (?, ?, ?, ?, ?)
        """, [
            (room_code, round_number, p['name'], p['score'], p['cardCount'])
            for p in leaderboard
        ])

def get_leaderboard_history(room_code: str) -> list:
    """Retrieve all leaderboard snapshots for a room (ordered by round)."""
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT round_number, player_name, score, card_count, recorded_at
              FROM leaderboard_history
             WHERE room_code = ?
             ORDER BY round_number ASC, score DESC
        """, (room_code,)).fetchall()
        return [dict(r) for r in rows]
