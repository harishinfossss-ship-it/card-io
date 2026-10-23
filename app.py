import os
import uuid
import random
import string
import shutil
import threading
from datetime import datetime
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from mockDatabase import get_deck, get_stats_keys
import db as database

app = Flask(__name__, static_folder='public', static_url_path='')
app.config['SECRET_KEY'] = 'secret-nexus-battle'
socketio = SocketIO(app, cors_allowed_origins="*")

# ── Video files setup ──────────────────────────────────────────────────────
VIDEOS_DIR = os.path.join(app.root_path, 'public', 'videos')
os.makedirs(VIDEOS_DIR, exist_ok=True)
for v_name in [
    'Hero_transforms_into_alien_form_202609051001.mp4',
    'Armored_alien_slams_ground_202609051048.mp4',
    'Alien_leaps_and_strikes_202609051050.mp4'
]:
    src_file = os.path.join(app.root_path, v_name)
    dst_file = os.path.join(VIDEOS_DIR, v_name)
    if os.path.exists(src_file) and not os.path.exists(dst_file):
        try:
            shutil.copy2(src_file, dst_file)
        except Exception as e:
            print(f"Notice copying video {v_name}: {e}")

@app.route('/videos/<path:filename>')
def serve_video(filename):
    pub_vids = os.path.join(app.root_path, 'public', 'videos')
    if os.path.exists(os.path.join(pub_vids, filename)):
        return send_from_directory(pub_vids, filename)
    return send_from_directory(app.root_path, filename)

# ── In-memory state ────────────────────────────────────────────────────────
# rooms:           { room_code: { concept, state, players, host_sid, ... } }
# player_sessions: { socket_sid: { roomCode, name, sessionToken } }
# disconnect_timers: { socket_sid: threading.Timer }
rooms = {}
player_sessions = {}      # sid → { roomCode, name, sessionToken }
disconnect_timers = {}    # sid → Timer (90s grace on disconnect)

DISCONNECT_GRACE_SECONDS = 90

# ── Helpers ────────────────────────────────────────────────────────────────
def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

def get_seat_index(room, player_name):
    for i, p in enumerate(room['players']):
        if p['name'] == player_name:
            return i
    return len(room['players'])

def _get_active_online_players(room):
    return [p for p in room['players'] if len(p.get('cards', [])) > 0 and p.get('connected', True)]

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/game.html')
def game():
    return app.send_static_file('game.html')

# ── Socket: Create Room ────────────────────────────────────────────────────
@socketio.on('create_room')
def handle_create_room(data):
    player_name = data.get('playerName')
    concept = data.get('concept')
    cards_per_player = int(data.get('cardsPerPlayer', 0))
    max_rounds = int(data.get('maxRounds', 0))

    room_code = generate_room_code()
    while room_code in rooms:
        room_code = generate_room_code()

    sid = request.sid
    session_token = str(uuid.uuid4())

    join_room(room_code)
    player_data = {
        'id': sid,
        'name': player_name,
        'isHost': True,
        'cards': [],
        'score_count': 0,
        'session_token': session_token,
        'connected': True,
    }

    rooms[room_code] = {
        'concept': concept,
        'cards_per_player': cards_per_player,
        'max_rounds': max_rounds,
        'players': [player_data],
        'state': 'lobby',
        'host_sid': sid,
        'turn_index': 0,
        'round_count': 0,
        'tied_parameters': [],
        'leaderboard_shown_for_round': 0,
    }
    player_sessions[sid] = {
        'roomCode': room_code,
        'name': player_name,
        'sessionToken': session_token,
    }

    # Persist to DB
    database.save_game_session(room_code, rooms[room_code])
    database.save_player_session(session_token, room_code, player_data, 0)

    emit('room_created', {
        'roomCode': room_code,
        'sessionToken': session_token,
        'concept': concept,
        'cardsPerPlayer': cards_per_player,
        'maxRounds': max_rounds,
        'players': _public_players(rooms[room_code]),
    })

# ── Socket: Join Room ──────────────────────────────────────────────────────
@socketio.on('join_room')
def handle_join_room(data):
    player_name = data.get('playerName')
    room_code = data.get('roomCode', '').strip().upper()

    if room_code not in rooms:
        emit('error', 'Room not found or invalid.')
        return

    room = rooms[room_code]
    if room['state'] != 'lobby':
        emit('error', 'Game already in progress. Use "Rejoin" if you were already in this game.')
        return

    # Prevent duplicate names
    existing_names = [p['name'] for p in room['players']]
    if player_name in existing_names:
        emit('error', f'Name "{player_name}" is already taken in this room.')
        return

    sid = request.sid
    session_token = str(uuid.uuid4())
    seat_index = len(room['players'])

    join_room(room_code)
    player_data = {
        'id': sid,
        'name': player_name,
        'isHost': False,
        'cards': [],
        'score_count': 0,
        'session_token': session_token,
        'connected': True,
    }
    room['players'].append(player_data)
    player_sessions[sid] = {
        'roomCode': room_code,
        'name': player_name,
        'sessionToken': session_token,
    }

    # Persist to DB
    database.save_game_session(room_code, room)
    database.save_player_session(session_token, room_code, player_data, seat_index)

    emit('room_joined', {
        'roomCode': room_code,
        'sessionToken': session_token,
        'concept': room.get('concept', 'ben10'),
        'cardsPerPlayer': room.get('cards_per_player', 0),
        'maxRounds': room.get('max_rounds', 0),
        'players': _public_players(room),
    })
    emit('player_joined', {
        'players': _public_players(room),
        'concept': room.get('concept', 'ben10'),
        'cardsPerPlayer': room.get('cards_per_player', 0),
        'maxRounds': room.get('max_rounds', 0),
    }, room=room_code, include_self=False)

# ── Socket: Rejoin Room ────────────────────────────────────────────────────
@socketio.on('rejoin_room')
def handle_rejoin_room(data):
    token = data.get('sessionToken', '').strip()
    if not token:
        emit('rejoin_failed', {'reason': 'No session token provided.'})
        return

    saved = database.get_player_session(token)
    if not saved:
        emit('rejoin_failed', {'reason': 'Session not found. Please join fresh.'})
        return

    room_code = saved['room_code']
    player_name = saved['player_name']

    if room_code not in rooms:
        emit('rejoin_failed', {'reason': 'Room no longer exists.'})
        database.delete_player_session(token)
        return

    sid = request.sid
    room = rooms[room_code]

    # Cancel any pending disconnect timer for this player
    old_sid = None
    for p in room['players']:
        if p.get('session_token') == token:
            old_sid = p.get('id')
            break

    if old_sid and old_sid in disconnect_timers:
        disconnect_timers[old_sid].cancel()
        del disconnect_timers[old_sid]
        if old_sid in player_sessions:
            del player_sessions[old_sid]

    # Restore player in room with new socket sid
    rejoined = False
    for i, p in enumerate(room['players']):
        if p.get('session_token') == token or p.get('name') == player_name:
            p['id'] = sid
            p['connected'] = True
            if p.get('isHost'):
                room['host_sid'] = sid
            rejoined = True
            break

    if not rejoined:
        if room['state'] == 'lobby':
            seat_index = len(room['players'])
            player_data = {
                'id': sid,
                'name': player_name,
                'isHost': saved['is_host'],
                'cards': saved['cards'],
                'score_count': saved['score_count'],
                'session_token': token,
                'connected': True,
            }
            room['players'].append(player_data)
        else:
            emit('rejoin_failed', {'reason': 'Your slot is no longer available.'})
            return

    join_room(room_code)
    player_sessions[sid] = {
        'roomCode': room_code,
        'name': player_name,
        'sessionToken': token,
    }

    # Update DB to mark as reconnected
    database.save_player_session(token, room_code, _find_player(room, sid), get_seat_index(room, player_name))
    database.save_game_session(room_code, room)

    emit('rejoined', {
        'roomCode': room_code,
        'sessionToken': token,
        'gameState': room['state'],
        'concept': room.get('concept', 'ben10'),
        'cardsPerPlayer': room.get('cards_per_player', 0),
        'maxRounds': room.get('max_rounds', 0),
        'players': _public_players(room),
    })

    if room['state'] == 'playing':
        emit_game_state(room_code)
        emit('player_status_changed', {
            'players': _public_players(room),
            'reconnectedName': player_name,
            'connected': True
        }, room=room_code)
        emit('chat_message', {
            'sender': 'SYSTEM',
            'senderId': 'system',
            'text': f"⚡ {player_name} reconnected to battle.",
            'time': datetime.now().strftime('%H:%M'),
            'isSystem': True
        }, room=room_code)
    elif room['state'] == 'lobby':
        emit('player_joined', {'players': _public_players(room)}, room=room_code, include_self=False)

# ── Socket: Start Game ─────────────────────────────────────────────────────
@socketio.on('start_game')
def handle_start_game(data):
    room_code = data.get('roomCode')
    sid = request.sid
    if room_code not in rooms or rooms[room_code]['host_sid'] != sid:
        return

    room = rooms[room_code]
    room['state'] = 'playing'

    deck = get_deck(room['concept'])
    random.shuffle(deck)
    num_players = len(room['players'])
    
    config_cards = room.get('cards_per_player', 0)
    max_possible = len(deck) // max(1, num_players)
    if config_cards > 0 and config_cards <= max_possible:
        cards_per_player = config_cards
    else:
        cards_per_player = max_possible

    for i, player in enumerate(room['players']):
        player['cards'] = deck[i * cards_per_player: (i + 1) * cards_per_player]

    room['turn_index'] = 0
    room['tied_parameters'] = []
    room['round_count'] = 0
    room['leaderboard_shown_for_round'] = 0

    # Persist
    database.save_game_session(room_code, room)
    for i, player in enumerate(room['players']):
        token = player.get('session_token')
        if token:
            database.save_player_session(token, room_code, player, i)

    emit('game_started', {}, room=room_code)

# ── Socket: Request Game State ─────────────────────────────────────────────
@socketio.on('request_game_state')
def handle_request_game_state():
    sid = request.sid
    if sid not in player_sessions:
        return
    room_code = player_sessions[sid]['roomCode']
    room = rooms.get(room_code)
    if not room:
        return
    emit_game_state(room_code)
    check_game_over(room_code)

# ── Socket: Select Parameter ───────────────────────────────────────────────
@socketio.on('select_parameter')
def handle_select_parameter(data):
    sid = request.sid
    if sid not in player_sessions:
        return
    room_code = player_sessions[sid]['roomCode']
    room = rooms.get(room_code)
    if not room or room['state'] != 'playing':
        return

    parameter = data.get('parameter')
    active_player = room['players'][room['turn_index']]

    if sid != active_player['id']:
        return

    tied_parameters = room.setdefault('tied_parameters', [])
    if parameter in tied_parameters:
        emit('error', f"'{parameter.upper()}' was already tied! Please choose a different stat.")
        return

    active_online = _get_active_online_players(room)
    if len(active_online) < 2:
        emit('game_message', {'msg': '⚠️ Waiting for opponent to reconnect before battling...'})
        return

    best_value = -1
    winner_idx = -1
    revealed_cards = []
    best_values_indices = []

    for i, p in enumerate(room['players']):
        # DO NOT consider cards of offline players — only active online players battle
        if len(p['cards']) == 0 or not p.get('connected', True):
            continue
        top_card = p['cards'][0]
        val = top_card.get(parameter, 0)
        revealed_cards.append({'playerName': p['name'], 'card': top_card, 'value': val})
        if val > best_value:
            best_value = val
            best_values_indices = [i]
            winner_idx = i
        elif val == best_value:
            best_values_indices.append(i)

    # ── Tie ────────────────────────────────────────────────────────────────
    if len(best_values_indices) > 1:
        tied_players = [room['players'][idx]['name'] for idx in best_values_indices]
        if parameter not in tied_parameters:
            tied_parameters.append(parameter)

        all_stats = get_stats_keys(room['concept'])
        if len(tied_parameters) >= len(all_stats):
            # All stats tied — rotate top cards to bottom, reset
            for p in room['players']:
                if len(p['cards']) > 0 and p.get('connected', True):
                    c = p['cards'].pop(0)
                    p['cards'].append(c)
            room['tied_parameters'] = []
            _persist_round_state(room_code, room)
            emit('all_tied_result', {
                'parameter': parameter,
                'revealedCards': revealed_cards,
                'message': 'All stats tied! Cards moved to the bottom of each deck.',
            }, room=room_code)
            return

        emit('tie_result', {
            'parameter': parameter,
            'tiedParameters': tied_parameters,
            'revealedCards': revealed_cards,
            'activePlayerId': active_player['id'],
            'tiedPlayers': tied_players,
        }, room=room_code)
        return

    # ── Winner determined ──────────────────────────────────────────────────
    room['tied_parameters'] = []
    winner = room['players'][winner_idx]
    pocketed_cards = []

    for p in room['players']:
        # Only take cards from online participating players
        if len(p['cards']) > 0 and p.get('connected', True):
            c = p['cards'].pop(0)
            pocketed_cards.append(c)

    # *** KEY FIX: Won cards go to the END of the winner's PLAYABLE deck ***
    winner['cards'].extend(pocketed_cards)
    # Track count for leaderboard display only
    winner['score_count'] = winner.get('score_count', 0) + len(pocketed_cards)

    room['turn_index'] = winner_idx
    room['round_count'] = room.get('round_count', 0) + 1
    current_round = room['round_count']

    _persist_round_state(room_code, room)

    emit('round_result', {
        'parameter': parameter,
        'revealedCards': revealed_cards,
        'winnerName': winner['name'],
        'winnerId': winner['id'],
        'roundCount': current_round,
    }, room=room_code)

# ── Socket: Next Round ─────────────────────────────────────────────────────
@socketio.on('next_round')
def handle_next_round():
    sid = request.sid
    if sid not in player_sessions:
        return
    room_code = player_sessions[sid]['roomCode']
    room = rooms.get(room_code)
    if not room:
        return

    room['tied_parameters'] = []
    active_player = room['players'][room['turn_index']]
    
    # Allow active player (winner), host, or any connected player if active player went offline
    is_active = (sid == active_player['id'])
    is_host = (sid == room.get('host_sid'))
    active_is_offline = not active_player.get('connected', True)

    if not is_active and not is_host and not active_is_offline:
        return

    current_round = room.get('round_count', 0)

    # Milestone leaderboard every 10 rounds
    if (current_round > 0
            and current_round % 10 == 0
            and room.get('leaderboard_shown_for_round') != current_round):

        room['leaderboard_shown_for_round'] = current_round
        milestone_index = current_round // 10

        leaderboard = []
        for p in room['players']:
            score = p.get('score_count', 0)
            active_cards = len(p.get('cards', []))
            leaderboard.append({
                'id': p['id'],
                'name': p['name'],
                'score': score,
                'cardCount': active_cards,
                'totalCards': score + active_cards,
            })
        leaderboard.sort(key=lambda x: (x['cardCount'], x['score']), reverse=True)

        # Persist snapshot to DB
        database.save_leaderboard_snapshot(room_code, current_round, leaderboard)
        database.save_game_session(room_code, room)

        emit('show_leaderboard', {
            'round': current_round,
            'nextRound': current_round + 1,
            'milestone': milestone_index,
            'leaderboard': leaderboard,
        }, room=room_code)
        return

    emit_game_state(room_code)
    check_game_over(room_code)

# ── Socket: Resume from Leaderboard ───────────────────────────────────────
@socketio.on('resume_from_leaderboard')
def handle_resume_from_leaderboard():
    sid = request.sid
    if sid not in player_sessions:
        return
    room_code = player_sessions[sid]['roomCode']
    room = rooms.get(room_code)
    if not room:
        return
    emit_game_state(room_code)
    check_game_over(room_code)

# ── Socket: End Game Solo (Opponents Offline) ──────────────────────────────
@socketio.on('end_game_solo')
def handle_end_game_solo():
    sid = request.sid
    if sid not in player_sessions:
        return
    room_code = player_sessions[sid]['roomCode']
    room = rooms.get(room_code)
    if not room or room.get('state') != 'playing':
        return

    # Find the player holding the highest number of cards (or score_count if tied)
    candidates = room['players']
    if not candidates:
        return

    # Sort descending by active cards held, then total score
    winner = max(candidates, key=lambda p: (len(p.get('cards', [])), p.get('score_count', 0)))
    room['state'] = 'finished'
    database.save_game_session(room_code, room)

    emit('game_over', {
        'winnerName': winner['name'],
        'videoUrl': '/videos/Hero_transforms_into_alien_form_202609051001.mp4',
        'reason': f"Game ended: {winner['name']} holds the highest card count ({len(winner.get('cards', []))} cards)!"
    }, room=room_code)

# ── Socket: Chat Message ───────────────────────────────────────────────────
@socketio.on('send_chat_message')
def handle_send_chat_message(data):
    sid = request.sid
    if sid not in player_sessions:
        return
    session = player_sessions[sid]
    room_code = session.get('roomCode')
    if not room_code or room_code not in rooms:
        return

    msg = str(data.get('message', '')).strip()
    if not msg:
        return
    if len(msg) > 300:
        msg = msg[:300]

    sender_name = session.get('name', 'Player')
    sender_is_host = False
    for p in rooms[room_code]['players']:
        if p.get('name') == sender_name:
            sender_is_host = p.get('isHost', False)
            break

    payload = {
        'sender': sender_name,
        'senderId': sid,
        'text': msg,
        'time': datetime.now().strftime('%H:%M'),
        'isHost': sender_is_host,
    }
    emit('chat_message', payload, room=room_code)

# ── Socket: Disconnect ─────────────────────────────────────────────────────
@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid not in player_sessions:
        return

    session = player_sessions[sid]
    room_code = session['roomCode']
    token = session.get('sessionToken')

    # Mark disconnected in DB immediately
    if token:
        database.mark_player_disconnected(token)

    # Mark disconnected in memory but keep player in room
    if room_code in rooms:
        for p in rooms[room_code]['players']:
            if p['id'] == sid:
                p['connected'] = False
                break

        # Notify room
        if rooms[room_code]['state'] == 'lobby':
            emit('player_left', {'players': _public_players(rooms[room_code])}, room=room_code)
        else:
            emit('game_message', {
                'msg': f"{session['name']} disconnected. Waiting for them to reconnect ({DISCONNECT_GRACE_SECONDS}s)..."
            }, room=room_code)
            emit('player_status_changed', {
                'players': _public_players(rooms[room_code]),
                'disconnectedName': session['name'],
                'connected': False
            }, room=room_code)
            emit('chat_message', {
                'sender': 'SYSTEM',
                'senderId': 'system',
                'text': f"⚠️ {session['name']} went offline.",
                'time': datetime.now().strftime('%H:%M'),
                'isSystem': True
            }, room=room_code)

        # If disconnected player had the active turn in game, shift to next online player immediately
        if rooms[room_code]['state'] == 'playing':
            room = rooms[room_code]
            if room['turn_index'] < len(room['players']) and room['players'][room['turn_index']]['id'] == sid:
                attempts = 0
                while attempts < len(room['players']):
                    room['turn_index'] = (room['turn_index'] + 1) % len(room['players'])
                    cand = room['players'][room['turn_index']]
                    if len(cand['cards']) > 0 and cand.get('connected', True):
                        break
                    attempts += 1
            emit_game_state_background(room_code)

        # Start grace timer — after 90s, remove the player permanently
        def _remove_player_after_grace(s_id, r_code, tok, p_name):
            if r_code not in rooms:
                return
            room = rooms[r_code]
            # Check if they reconnected (their id would have changed)
            still_disconnected = any(
                p.get('name') == p_name and not p.get('connected')
                for p in room['players']
            )
            if not still_disconnected:
                return  # They rejoined — do nothing

            # Remove the player
            room['players'] = [p for p in room['players'] if p.get('name') != p_name]
            if tok:
                database.delete_player_session(tok)

            if len(room['players']) == 0:
                del rooms[r_code]
                database.delete_game_session(r_code)
                return

            # Re-assign host if needed
            if room.get('host_sid') == s_id:
                room['players'][0]['isHost'] = True
                room['host_sid'] = room['players'][0]['id']

            # Fix turn_index
            if room['turn_index'] >= len(room['players']):
                room['turn_index'] = 0

            database.save_game_session(r_code, room)
            socketio.emit('game_message', {'msg': f'{p_name} has left the game.'}, room=r_code)
            emit_game_state_background(r_code)

        timer = threading.Timer(
            DISCONNECT_GRACE_SECONDS,
            _remove_player_after_grace,
            args=(sid, room_code, token, session['name'])
        )
        timer.daemon = True
        timer.start()
        disconnect_timers[sid] = timer

    del player_sessions[sid]

# ── Helpers ────────────────────────────────────────────────────────────────
def _find_player(room, sid):
    for p in room['players']:
        if p['id'] == sid:
            return p
    return {}

def _public_players(room):
    result = []
    for p in room['players']:
        result.append({
            'id': p['id'],
            'name': p['name'],
            'isHost': p.get('isHost', False),
            'cardCount': len(p.get('cards', [])),
            'scoreCount': p.get('score_count', 0),
            'connected': p.get('connected', True),
        })
    return result

def _persist_round_state(room_code, room):
    """Save game + all player states to DB after each round."""
    database.save_game_session(room_code, room)
    for i, player in enumerate(room['players']):
        token = player.get('session_token')
        if token:
            database.save_player_session(token, room_code, player, i)

def check_game_over(room_code):
    if room_code not in rooms:
        return
    room = rooms[room_code]
    active_players = [p for p in room['players'] if len(p['cards']) > 0]
    max_rounds = room.get('max_rounds', 0)
    current_round = room.get('round_count', 0)

    # 1. Round Limit check
    if max_rounds > 0 and current_round >= max_rounds:
        candidates = room['players']
        if not candidates:
            return
        winner = max(candidates, key=lambda p: (len(p.get('cards', [])), p.get('score_count', 0)))
        room['state'] = 'finished'
        database.save_game_session(room_code, room)
        emit('game_over', {
            'winnerName': winner['name'],
            'videoUrl': '/videos/Hero_transforms_into_alien_form_202609051001.mp4',
            'reason': f"Round Limit Reached ({max_rounds} Rounds)! {winner['name']} wins with {len(winner.get('cards', []))} cards!",
            'maxRounds': max_rounds,
            'roundCount': current_round,
        }, room=room_code)
        return

    # 2. Classic Elimination / Last player standing
    if len(active_players) == 1:
        winner = active_players[0]
        room['state'] = 'finished'
        database.save_game_session(room_code, room)
        emit('game_over', {
            'winnerName': winner['name'],
            'videoUrl': '/videos/Hero_transforms_into_alien_form_202609051001.mp4',
            'reason': f"Victory! {winner['name']} captured all the cards!",
        }, room=room_code)
    elif len(active_players) == 0:
        # Edge case: all ran out simultaneously — highest score_count wins
        best = max(room['players'], key=lambda p: p.get('score_count', 0))
        room['state'] = 'finished'
        database.save_game_session(room_code, room)
        emit('game_over', {
            'winnerName': best['name'],
            'videoUrl': '/videos/Hero_transforms_into_alien_form_202609051001.mp4',
            'reason': f"Game ended! {best['name']} wins with highest score!",
        }, room=room_code)

def emit_game_state(room_code):
    if room_code not in rooms:
        return
    room = rooms[room_code]
    active_online = _get_active_online_players(room)

    # Skip to next player who has cards AND is online
    if active_online:
        attempts = 0
        while (len(room['players'][room['turn_index']]['cards']) == 0
               or not room['players'][room['turn_index']].get('connected', True)):
            room['turn_index'] = (room['turn_index'] + 1) % len(room['players'])
            attempts += 1
            if attempts > len(room['players']):
                break

    active_player = room['players'][room['turn_index']]
    public_players = _public_players(room)

    for p in room['players']:
        top_card = p['cards'][0] if len(p['cards']) > 0 else None
        emit('game_state_update', {
            'concept': room['concept'],
            'cardsPerPlayer': room.get('cards_per_player', 0),
            'maxRounds': room.get('max_rounds', 0),
            'stats_keys': get_stats_keys(room['concept']),
            'tiedParameters': room.get('tied_parameters', []),
            'roundCount': room.get('round_count', 0),
            'players': public_players,
            'activePlayerId': active_player['id'],
            'myTopCard': top_card,
            'myCards': p['cards'],
            'eliminated': len(p['cards']) == 0,
        }, to=p['id'])

def emit_game_state_background(room_code):
    """Thread-safe version of emit_game_state for use in timer callbacks."""
    if room_code not in rooms:
        return
    room = rooms[room_code]
    active_online = _get_active_online_players(room)
    if not active_online:
        return

    attempts = 0
    while (len(room['players'][room['turn_index']]['cards']) == 0
           or not room['players'][room['turn_index']].get('connected', True)):
        room['turn_index'] = (room['turn_index'] + 1) % len(room['players'])
        attempts += 1
        if attempts > len(room['players']):
            break

    active_player = room['players'][room['turn_index']]
    public_players = _public_players(room)

    for p in room['players']:
        if p['id'] is None:
            continue
        top_card = p['cards'][0] if len(p['cards']) > 0 else None
        socketio.emit('game_state_update', {
            'concept': room['concept'],
            'cardsPerPlayer': room.get('cards_per_player', 0),
            'maxRounds': room.get('max_rounds', 0),
            'stats_keys': get_stats_keys(room['concept']),
            'tiedParameters': room.get('tied_parameters', []),
            'roundCount': room.get('round_count', 0),
            'players': public_players,
            'activePlayerId': active_player['id'],
            'myTopCard': top_card,
            'myCards': p['cards'],
            'eliminated': len(p['cards']) == 0,
        }, to=p['id'])

# ── Startup ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    database.init_db()
    restored = database.load_all_game_sessions()
    rooms.update(restored)
    socketio.run(app, debug=False, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
