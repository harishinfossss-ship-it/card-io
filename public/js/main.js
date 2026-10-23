const socket = io();

// ─── SESSION STORAGE KEY ─────────────────────────────────────────────────
const SESSION_KEY = 'nexusBattleSession';

// ─── LOBBY ELEMENTS ──────────────────────────────────────────────────────
const lobbyWrapper        = document.getElementById('lobby-wrapper');
const joinSection         = document.getElementById('join-section');
const createRoomDetails   = document.getElementById('create-room-details');
const lobbyWait           = document.getElementById('lobby-wait');
const playerNameInput     = document.getElementById('player-name');
const roomCodeInput       = document.getElementById('room-code-input');
const errorMsg            = document.getElementById('error-message');
const btnCreateRoom       = document.getElementById('btn-create-room');
const btnJoinRoom         = document.getElementById('btn-join-room');
const btnGenerateLobby    = document.getElementById('btn-generate-lobby');
const btnBackCreate       = document.getElementById('btn-back-create');
const btnCopyLink         = document.getElementById('btn-copy-link');
const btnStartGame        = document.getElementById('btn-start-game');
const displayRoomCode     = document.getElementById('display-room-code');
const playerCount         = document.getElementById('player-count');
const playersList         = document.getElementById('players-list');
const lobbyStatusMsg      = document.getElementById('lobby-status-msg');
const conceptCards        = document.querySelectorAll('.concept-card');

// ─── REJOIN BANNER ───────────────────────────────────────────────────────
const rejoinBanner        = document.getElementById('rejoin-banner');
const rejoinRoomDisplay   = document.getElementById('rejoin-room-code-display');
const rejoinNameDisplay   = document.getElementById('rejoin-player-name-display');
const btnRejoin           = document.getElementById('btn-rejoin');
const btnClearSession     = document.getElementById('btn-clear-session');

// ─── GAME ELEMENTS ───────────────────────────────────────────────────────
const gameContainer       = document.getElementById('game-container');
const myDeckList          = document.getElementById('my-deck-list');
const arena               = document.getElementById('arena');
const arenaCards          = document.getElementById('arena-cards');
const winnerText          = document.getElementById('winner-text');
const btnNextRound        = document.getElementById('btn-next-round');
const btnBreakTie         = document.getElementById('btn-break-tie');
const myCardCount         = document.getElementById('my-card-count');
const turnIndicator       = document.getElementById('turn-indicator');
const cardStatsCol        = document.getElementById('card-stats');
const myActiveCardContainer = document.getElementById('my-active-card');
const cardParticles       = document.getElementById('card-particles');
const eliminatedOverlay   = document.getElementById('eliminated-overlay');

// ─── GAME OVER ELEMENTS ──────────────────────────────────────────────────
const gameOverScreen      = document.getElementById('game-over-screen');
const gameoverVideoEl     = document.getElementById('gameover-video');
const gameoverVideoSource = document.getElementById('gameover-video-source');
const gameoverResult      = document.getElementById('gameover-result');
const gameWinnerEl        = document.getElementById('game-winner');
const btnBackLobby        = document.getElementById('btn-back-lobby');

// ─── LEADERBOARD MILESTONE ELEMENTS ─────────────────────────────────────
const leaderboardOverlay    = document.getElementById('leaderboard-overlay');
const lbVideo               = document.getElementById('lb-video');
const lbVideoSource         = document.getElementById('lb-video-source');
const lbVideoTitle          = document.getElementById('lb-video-title');
const lbMilestoneTag        = document.getElementById('lb-milestone-tag');
const lbPlayersList         = document.getElementById('lb-players-list');
const lbCountdownNum        = document.getElementById('lb-countdown-num');
const lbNextRoundNum        = document.getElementById('lb-next-round-num');
const btnResumeBattle       = document.getElementById('btn-resume-battle');
const currentRoundDisplay   = document.getElementById('current-round-number');
const roundMilestoneHint    = document.getElementById('round-milestone-hint');
const lbPresentation        = document.getElementById('lb-presentation');
const leaderSpotlightCard   = document.getElementById('leader-spotlight-card');
const leaderTopName         = document.getElementById('leader-top-name');
const leaderTopScore        = document.getElementById('leader-top-score');
const leaderTopDeck         = document.getElementById('leader-top-deck');
const btnSoundToggle        = document.getElementById('btn-sound-toggle');
const btnSkipVideo          = document.getElementById('btn-skip-video');
const btnReplayVideo        = document.getElementById('btn-replay-video');
const cinemaProgressBar     = document.getElementById('cinema-progress-bar');
const cinemaProgressContainer = document.getElementById('cinema-progress-container');
const cinemaHudTop          = document.getElementById('cinema-hud-top');

let leaderboardCountdownTimer   = null;
let leaderboardCountdownSeconds = 10;
let isLeaderPresented           = false;
let leaderPresentationTimeout   = null;

// ─── HUD SIDE DRAWERS & CHAT ELEMENTS ─────────────────────────────────────
const btnTogglePlayersDrawer  = document.getElementById('btn-toggle-players-drawer');
const btnClosePlayersDrawer   = document.getElementById('btn-close-players-drawer');
const playersDrawer           = document.getElementById('players-drawer');
const drawerPlayersList       = document.getElementById('drawer-players-list');
const dockPlayersCountBadge   = document.getElementById('dock-players-count-badge');

const btnToggleChatDrawer     = document.getElementById('btn-toggle-chat-drawer');
const btnCloseChatDrawer      = document.getElementById('btn-close-chat-drawer');
const chatDrawer              = document.getElementById('chat-drawer');
const dockChatUnreadBadge     = document.getElementById('dock-chat-unread-badge');
const chatMessagesContainer   = document.getElementById('chat-messages-container');
const chatForm                = document.getElementById('chat-form');
const chatInputText           = document.getElementById('chat-input-text');
const drawerBackdrop          = document.getElementById('drawer-backdrop');

// ─── SOLO PLAYER / OFFLINE MODAL ELEMENTS ─────────────────────────────────
const soloPromptModal         = document.getElementById('solo-prompt-modal');
const btnSoloWait             = document.getElementById('btn-solo-wait');
const btnSoloEnd              = document.getElementById('btn-solo-end');

let currentPlayers            = [];
let currentActivePlayerId     = null;
let unreadChatCount           = 0;
let soloCountdownTimer        = null;
let soloCountdownSeconds      = 60;

// ─── SHUFFLE OVERLAY ELEMENTS ────────────────────────────────────────────
const shuffleOverlay   = document.getElementById('shuffle-overlay');
const shuffleDeckArea  = document.getElementById('shuffle-deck-area');
const shuffleTitle     = document.getElementById('shuffle-title');
const shuffleSubtitle  = document.getElementById('shuffle-subtitle');

// ─── AUDIO PLAYLIST MANAGEMENT (SEQUENTIAL 3 TRACKS) ─────────────────────
const bgmPlaylist = [
    { src: 'audio/bgm_tamil.mp4', title: 'Tamil BGM' },
    { src: 'audio/bgm_wa1.mpeg',   title: 'WhatsApp Audio 1' },
    { src: 'audio/bgm_wa2.mpeg',   title: 'WhatsApp Audio 2' },
];
let currentTrackIndex = 0;
let bgmAudio = null;
let isBgmPlaying = false;

function playTrack(index) {
    if (index < 0 || index >= bgmPlaylist.length) {
        index = 0;
    }
    currentTrackIndex = index;

    if (!bgmAudio) {
        bgmAudio = new Audio();
    } else {
        bgmAudio.pause();
    }

    bgmAudio.src = bgmPlaylist[currentTrackIndex].src;
    bgmAudio.loop = false; // Do not loop individual track; play sequentially
    bgmAudio.volume = 0.4;

    // Advance to next track when current one finishes
    bgmAudio.onended = () => {
        if (!isBgmPlaying) return;
        const nextIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
        playTrack(nextIndex);
    };

    // Auto-skip on load error
    bgmAudio.onerror = (e) => {
        console.warn('Track playback failed, playing next track:', e);
        if (isBgmPlaying) {
            setTimeout(() => {
                const nextIndex = (currentTrackIndex + 1) % bgmPlaylist.length;
                playTrack(nextIndex);
            }, 800);
        }
    };

    const playPromise = bgmAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            console.log('Audio autoplay blocked or interrupted:', e);
        });
    }
}

function startBackgroundMusic() {
    isBgmPlaying = true;
    playTrack(0);
}

function stopBackgroundMusic() {
    isBgmPlaying = false;
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
}

// User interaction fallback in case browser blocks initial autoplay
document.addEventListener('click', () => {
    if (isBgmPlaying && bgmAudio && bgmAudio.paused) {
        bgmAudio.play().catch(() => {});
    }
}, { once: true });

// ─── STATE ───────────────────────────────────────────────────────────────
let selectedConcept       = 'ben10';
let selectedCardsPerPlayer = 10;
let selectedMaxRounds     = 50;

let currentCardsPerPlayer = 10;
let currentMaxRounds      = 50;
let isHost                = false;
let currentRoomCode       = '';
let amIActive             = false;
let currentTopCard        = null;
let currentConcept        = 'ben10';
let currentStatsKeys      = ['attack', 'strength', 'speed', 'durability'];
let currentTiedParameters = [];
let tieAutoCloseTimer     = null;
let mySessionToken        = null;

// ─── CHIP SELECTORS FOR ROOM CONFIG ──────────────────────────────────────
const cardsPerPlayerChips = document.querySelectorAll('#cards-per-player-chips .config-chip');
const customCardsInput    = document.getElementById('custom-cards-input');
const cardsSelectedHint   = document.getElementById('cards-selected-hint');

const gameModeChips       = document.querySelectorAll('#game-mode-chips .config-chip');
const customRoundsInput   = document.getElementById('custom-rounds-input');
const modeSelectedHint    = document.getElementById('mode-selected-hint');

function updateCardsHint(cards) {
    if (!cardsSelectedHint) return;
    if (cards === 0) {
        cardsSelectedHint.innerText = 'Full Deck';
    } else {
        cardsSelectedHint.innerText = `${cards} Cards / Player`;
    }
}

function updateModeHint(rounds) {
    if (!modeSelectedHint) return;
    if (rounds === 0) {
        modeSelectedHint.innerText = 'Classic Elimination';
    } else {
        modeSelectedHint.innerText = `${rounds} Rounds`;
    }
}

cardsPerPlayerChips.forEach(chip => {
    chip.addEventListener('click', () => {
        cardsPerPlayerChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedCardsPerPlayer = parseInt(chip.dataset.cards || 0);
        if (customCardsInput) customCardsInput.value = '';
        updateCardsHint(selectedCardsPerPlayer);
    });
});

if (customCardsInput) {
    customCardsInput.addEventListener('input', () => {
        const val = parseInt(customCardsInput.value);
        if (!isNaN(val) && val > 0) {
            cardsPerPlayerChips.forEach(c => c.classList.remove('active'));
            selectedCardsPerPlayer = Math.min(Math.max(val, 1), 100);
            updateCardsHint(selectedCardsPerPlayer);
        }
    });
}

gameModeChips.forEach(chip => {
    chip.addEventListener('click', () => {
        gameModeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedMaxRounds = parseInt(chip.dataset.rounds || 0);
        if (customRoundsInput) customRoundsInput.value = '';
        updateModeHint(selectedMaxRounds);
    });
});

if (customRoundsInput) {
    customRoundsInput.addEventListener('input', () => {
        const val = parseInt(customRoundsInput.value);
        if (!isNaN(val) && val > 0) {
            gameModeChips.forEach(c => c.classList.remove('active'));
            selectedMaxRounds = Math.min(Math.max(val, 1), 500);
            updateModeHint(selectedMaxRounds);
        }
    });
}

// ─── RULES MODAL HANDLERS ────────────────────────────────────────────────
const btnGameRulesModal  = document.getElementById('btn-game-rules-modal');
const rulesModalOverlay  = document.getElementById('rules-modal-overlay');
const btnCloseRulesModal = document.getElementById('btn-close-rules-modal');
const btnAckRules        = document.getElementById('btn-ack-rules');

if (btnGameRulesModal) {
    btnGameRulesModal.addEventListener('click', () => {
        if (rulesModalOverlay) rulesModalOverlay.classList.remove('hidden');
    });
}
if (btnCloseRulesModal) {
    btnCloseRulesModal.addEventListener('click', () => {
        if (rulesModalOverlay) rulesModalOverlay.classList.add('hidden');
    });
}
if (btnAckRules) {
    btnAckRules.addEventListener('click', () => {
        if (rulesModalOverlay) rulesModalOverlay.classList.add('hidden');
    });
}

// ─── STAT CONFIG ─────────────────────────────────────────────────────────
const STAT_CONFIG = {
    attack:     { color: '#ff3333', icon: '⚔️',  label: 'ATTACK' },
    strength:   { color: '#33cc33', icon: '🛡️',  label: 'STRENGTH' },
    speed:      { color: '#3399ff', icon: '⚡',   label: 'SPEED' },
    durability: { color: '#ffcc00', icon: '🔰',  label: 'DURABILITY' },
    batting:    { color: '#ff8a00', icon: '🏏',  label: 'BATTING' },
    bowling:    { color: '#3399ff', icon: '🎯',  label: 'BOWLING' },
    fielding:   { color: '#00ff41', icon: '🧤',  label: 'FIELDING' },
    agility:    { color: '#00f2fe', icon: '💨',  label: 'AGILITY' },
    weapons:    { color: '#ff007f', icon: '🗡️', label: 'WEAPONS' },
};

const ELEMENT_ICONS = {
    Pyronite: '🔥', Necrofriggian: '❄️', Petrosapien: '💎',
    Kineceleran: '⚡', Sonorosian: '🔊', Vaxasaurian: '🦕',
    Conductoid: '⚡', Celestialsapien: '✨', Chronosapien: '⏱️',
    Aerophibian: '🌊', Galilean: '🌍', Amperi: '⚡',
    Plumbers: '🔧', Ectonurite: '👻', default: '🔮',
};

// ─── URL INVITE CODE ─────────────────────────────────────────────────────
const urlParams  = new URLSearchParams(window.location.search);
const inviteCode = urlParams.get('room');
if (inviteCode) roomCodeInput.value = inviteCode;

// ─── SESSION: CHECK ON LOAD ───────────────────────────────────────────────
(function checkSavedSession() {
    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (saved && saved.sessionToken && saved.roomCode && saved.playerName) {
            rejoinRoomDisplay.textContent  = saved.roomCode;
            rejoinNameDisplay.textContent  = saved.playerName;
            rejoinBanner.classList.remove('hidden');
        }
    } catch (e) {
        localStorage.removeItem(SESSION_KEY);
    }
})();

function saveSession(token, roomCode, playerName, host) {
    mySessionToken = token;
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            sessionToken: token,
            roomCode,
            playerName,
            isHost: host,
        }));
    } catch (e) { /* storage full — ignore */ }
}

function clearSession() {
    mySessionToken = null;
    localStorage.removeItem(SESSION_KEY);
    rejoinBanner.classList.add('hidden');
}

// ─── REJOIN BANNER EVENTS ─────────────────────────────────────────────────
if (btnRejoin) {
    btnRejoin.addEventListener('click', () => {
        try {
            const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (saved && saved.sessionToken) {
                btnRejoin.disabled = true;
                btnRejoin.textContent = 'Rejoining...';
                socket.emit('rejoin_room', { sessionToken: saved.sessionToken });
            }
        } catch (e) {
            clearSession();
        }
    });
}

if (btnClearSession) {
    btnClearSession.addEventListener('click', () => {
        clearSession();
    });
}

// ─── DECK TEASER MODAL & CONTINUOUS LOOP SLIDESHOW ────────────────────────
const deckTeaserModal     = document.getElementById('deck-teaser-modal');
const btnCloseTeaser      = document.getElementById('btn-close-teaser');
const btnTeaserBack       = document.getElementById('btn-teaser-back');
const teaserBadge         = document.getElementById('teaser-badge');
const teaserTitle         = document.getElementById('teaser-title');
const teaserSubtitle      = document.getElementById('teaser-subtitle');
const teaserSlidesTrack   = document.getElementById('teaser-slides-track');
const teaserDots          = document.getElementById('teaser-dots');

let teaserLoopInterval    = null;
let currentTeaserIndex    = 0;
let teaserPhotosList      = [];

const TEASER_DECKS = {
    avengers: {
        title: 'Avengers Multiverse Deck',
        badge: '⚡ MARVEL HEROES',
        subtitle: "Earth's Mightiest Heroes assemble for epic multiverse card battles!",
        photos: [
            { src: '/images/avengers/avengers_1.jpg', alt: 'Avengers Heroes Assemble' }
        ]
    },
    cricket: {
        title: 'Cricket Legends Deck',
        badge: '🏏 CRICKET HEROES',
        subtitle: 'Master batting, bowling & fielding stats with iconic superstars!',
        photos: [
            { src: '/images/cricket/cricket_1.jpg', alt: 'Virat Kohli - Believe' },
            { src: '/images/cricket/cricket_2.jpg', alt: 'Team India Legends' }
        ]
    }
};

function openDeckTeaser(conceptKey) {
    const data = TEASER_DECKS[conceptKey] || TEASER_DECKS.avengers;
    if (!deckTeaserModal) return;

    if (teaserBadge)    teaserBadge.innerText    = data.badge;
    if (teaserTitle)    teaserTitle.innerText    = data.title;
    if (teaserSubtitle) teaserSubtitle.innerText = data.subtitle;

    teaserPhotosList   = data.photos;
    currentTeaserIndex = 0;

    // Render fullscreen slides
    if (teaserSlidesTrack) {
        teaserSlidesTrack.innerHTML = '';
        teaserPhotosList.forEach((item, idx) => {
            const slide = document.createElement('div');
            slide.className = `fullscreen-slide-item ${idx === 0 ? 'active' : ''}`;
            slide.innerHTML = `
                <img src="${item.src}" alt="${item.alt}">
            `;
            teaserSlidesTrack.appendChild(slide);
        });
    }

    // Render dots if multiple photos (e.g. Cricket continuous loop)
    if (teaserDots) {
        teaserDots.innerHTML = '';
        if (teaserPhotosList.length > 1) {
            teaserDots.style.display = 'flex';
            teaserPhotosList.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `fs-dot ${idx === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => setTeaserSlide(idx));
                teaserDots.appendChild(dot);
            });
        } else {
            teaserDots.style.display = 'none';
        }
    }

    // Start continuous loop for multiple photos (e.g. Cricket)
    clearInterval(teaserLoopInterval);
    if (teaserPhotosList.length > 1) {
        teaserLoopInterval = setInterval(() => {
            currentTeaserIndex = (currentTeaserIndex + 1) % teaserPhotosList.length;
            updateTeaserSlideDOM();
        }, 2800);
    }

    deckTeaserModal.classList.remove('hidden');
}

function setTeaserSlide(idx) {
    currentTeaserIndex = idx;
    updateTeaserSlideDOM();
    if (teaserPhotosList.length > 1) {
        clearInterval(teaserLoopInterval);
        teaserLoopInterval = setInterval(() => {
            currentTeaserIndex = (currentTeaserIndex + 1) % teaserPhotosList.length;
            updateTeaserSlideDOM();
        }, 2800);
    }
}

function updateTeaserSlideDOM() {
    if (!teaserSlidesTrack) return;
    const slides = teaserSlidesTrack.querySelectorAll('.fullscreen-slide-item');
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentTeaserIndex);
    });

    if (teaserDots) {
        const dots = teaserDots.querySelectorAll('.fs-dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentTeaserIndex);
        });
    }
}

function closeDeckTeaser() {
    clearInterval(teaserLoopInterval);
    if (deckTeaserModal) {
        deckTeaserModal.classList.add('hidden');
    }
    // Keep playable Ben 10 selected
    selectedConcept = 'ben10';
    conceptCards.forEach(c => {
        c.classList.toggle('active', c.dataset.concept === 'ben10');
    });
}

if (btnCloseTeaser) btnCloseTeaser.addEventListener('click', closeDeckTeaser);
if (btnTeaserBack)  btnTeaserBack.addEventListener('click', closeDeckTeaser);
if (deckTeaserModal) {
    deckTeaserModal.addEventListener('click', (e) => {
        if (e.target === deckTeaserModal) closeDeckTeaser();
    });
}

// Esc key to exit fullscreen teaser
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deckTeaserModal && !deckTeaserModal.classList.contains('hidden')) {
        closeDeckTeaser();
    }
});

// ─── CONCEPT SELECTOR ────────────────────────────────────────────────────
conceptCards.forEach(card => {
    card.addEventListener('click', () => {
        const concept = card.dataset.concept;
        if (concept === 'avengers' || concept === 'cricket') {
            openDeckTeaser(concept);
            return;
        }
        conceptCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedConcept = card.dataset.concept;
    });
});

// ─── HELPERS ─────────────────────────────────────────────────────────────
function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.classList.remove('hidden');
    setTimeout(() => errorMsg.classList.add('hidden'), 3500);
}

// ─── PARTICLE SPAWNER ────────────────────────────────────────────────────
function spawnParticles(color = '#00ff41') {
    if (!cardParticles) return;
    cardParticles.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left    = `${Math.random() * 55}%`;
        p.style.bottom  = `${Math.random() * 30 + 50}%`;
        p.style.background = color;
        p.style.setProperty('--dur',   `${2 + Math.random() * 3}s`);
        p.style.setProperty('--delay', `${Math.random() * 2}s`);
        p.style.width = p.style.height = `${2 + Math.random() * 3}px`;
        cardParticles.appendChild(p);
    }
}

// ─── STAT ROW BUILDER ────────────────────────────────────────────────────
function buildStatRow(key, value, cfg, index, clickable, onClick, isTied = false) {
    const pct = Math.min((value / 1000) * 100, 100);
    const div = document.createElement('div');
    const isActuallyClickable = clickable && !isTied;
    div.className = `stat-row${isActuallyClickable ? ' clickable' : ''}${isTied ? ' tied-disabled' : ''}`;
    div.style.setProperty('--stat-color', isTied ? '#ff4d4d' : cfg.color);
    div.style.setProperty('--delay', `${index * 0.1}s`);
    div.innerHTML = `
        <div class="stat-header-row">
            <div class="stat-icon">${isTied ? '⚠️' : cfg.icon}</div>
            <div class="stat-value">${value}</div>
            <div class="stat-label-text">
                ${cfg.label}
                ${isTied ? '<span class="tied-badge">TIED</span>' : ''}
            </div>
        </div>
        <div class="stat-bar-row">
            <div class="stat-bar-track">
                <div class="stat-bar-fill" data-pct="${pct}" style="background:${isTied ? '#ff4d4d' : cfg.color}; box-shadow:0 0 8px ${isTied ? '#ff4d4d' : cfg.color};"></div>
            </div>
            <div class="stat-max-text">/1000</div>
        </div>
    `;
    if (isActuallyClickable && onClick) {
        div.onclick = () => onClick(key);
    }
    return div;
}

function animateBars() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('.stat-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.pct + '%';
            });
        });
    });
}

// ─── DYNAMIC CARD SCALING (4K ULTRA-HD ADAPTIVE SCALING) ────────────────
function updateCardScale() {
    const playArea = document.querySelector('.game-play-area');
    if (!playArea) return;

    // Available space inside the play area
    const availH = playArea.clientHeight || (window.innerHeight - 195);
    const availW = playArea.clientWidth  || (window.innerWidth - 60);

    // Leave comfortable breathing room (~35px vertical, ~30px horizontal)
    const targetH = Math.max(availH - 35, 200);
    const targetW = Math.max(availW - 30, 200);

    const scaleH = targetH / 600;
    const scaleW = targetW / 420;

    // 4K Ultra-HD dynamic scaling: max 1.35 on large 4K/2K screens, min 0.52 on compact mobile
    const targetScale = Math.max(0.52, Math.min(1.35, scaleH, scaleW));
    const rounded = Math.round(targetScale * 1000) / 1000;

    document.documentElement.style.setProperty('--card-scale', rounded);
}

window.addEventListener('resize', updateCardScale);
window.addEventListener('orientationchange', updateCardScale);
window.addEventListener('DOMContentLoaded', updateCardScale);

// ─── CARD RENDERER ───────────────────────────────────────────────────────
function renderCard(card, concept, statsKeys, isActive, tiedParams = []) {
    if (!card) {
        myActiveCardContainer.style.display = 'none';
        return;
    }
    updateCardScale();
    myActiveCardContainer.style.display = 'flex';
    myActiveCardContainer.style.animation = 'none';
    void myActiveCardContainer.offsetWidth;
    myActiveCardContainer.style.animation = '';

    document.getElementById('card-rank').innerText   = String(card.rank || '00').padStart(2, '0').slice(0, 2);
    document.getElementById('card-series').innerText = (concept || 'BEN 10').toUpperCase().replace('BEN10', 'BEN 10');

    const imgEl = document.getElementById('card-image');
    imgEl.src = card.image || '';
    imgEl.onerror = () => { imgEl.src = ''; };

    const typeKey = Object.keys(ELEMENT_ICONS).find(k => (card.type || '').includes(k));
    document.getElementById('card-element-icon').innerText = typeKey ? ELEMENT_ICONS[typeKey] : ELEMENT_ICONS.default;

    document.getElementById('card-name').innerText  = (card.name || 'UNKNOWN').toUpperCase();
    document.getElementById('card-type').innerText  = (card.type || 'ALIEN').toUpperCase();
    document.getElementById('card-desc').innerText  = card.description || '';
    document.getElementById('card-flavor').innerText = card.flavor ? `"${card.flavor}"` : '';
    document.getElementById('card-ability-name').innerText  = (card.ability_name || '').toUpperCase();
    document.getElementById('card-ability-desc').innerText  = card.ability_effect || '';
    document.getElementById('card-special-name').innerText  = (card.special_name || '').toUpperCase();
    document.getElementById('card-special-desc').innerText  = card.special_effect || '';
    document.getElementById('card-ultimate-name').innerText = (card.ultimate_name || '').toUpperCase();
    document.getElementById('card-ultimate-desc').innerText = card.ultimate_effect || '';

    isActive
        ? myActiveCardContainer.classList.add('is-active-turn')
        : myActiveCardContainer.classList.remove('is-active-turn');

    cardStatsCol.innerHTML = '';
    const statOrder = (statsKeys && statsKeys.length > 0) ? statsKeys : ['attack', 'strength', 'speed', 'durability'];
    statOrder.forEach((key, i) => {
        const cfg = STAT_CONFIG[key.toLowerCase()] || { color: '#00ff41', icon: '⬡', label: key.toUpperCase() };
        const val = parseInt(card[key] || 0);
        const isTied = tiedParams.includes(key);
        const row = buildStatRow(key, val, cfg, i, isActive, isActive ? selectParameter : null, isTied);
        cardStatsCol.appendChild(row);
    });

    const particleColors = {
        Pyronite: '#ff6600', Necrofriggian: '#88ccff', Petrosapien: '#aaddff',
        Kineceleran: '#3399ff', Conductoid: '#ffcc00', default: '#00ff41',
    };
    const pKey = Object.keys(particleColors).find(k => (card.type || '').includes(k));
    spawnParticles(pKey ? particleColors[pKey] : particleColors.default);

    animateBars();
}

// ─── BOTTOM DECK PANEL ───────────────────────────────────────────────────
function renderMyDeck(myCards) {
    if (!myDeckList) return;
    myDeckList.innerHTML = '';
    if (!myCards || myCards.length === 0) return;
    myCards.forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = 'mini-card';
        if (idx === 0) {
            div.style.border     = '1px solid #00ff41';
            div.style.boxShadow  = '0 0 8px #00ff41';
        }
        div.style.zIndex = myCards.length - idx;
        div.innerHTML = `
            <img src="${card.image || ''}" alt="${card.name || 'Card'}" onerror="this.style.display='none'">
            <div class="mini-name">${(card.name || '?').toUpperCase()}</div>
        `;
        myDeckList.appendChild(div);
    });
}

// ─── LOBBY RULES & SETTINGS HELPERS ─────────────────────────────────────
function formatConceptName(concept) {
    if (!concept) return 'Ben 10';
    if (concept === 'ben10') return 'Ben 10';
    if (concept === 'cricket') return 'Cricket Heroes';
    if (concept === 'avengers') return 'Avengers';
    if (concept === 'powerrangers') return 'Power Rangers';
    return String(concept).toUpperCase();
}

function formatCardsPerPlayer(cards) {
    if (!cards || cards === 0) return 'All Cards (Full Deck)';
    return `${cards} Cards / Player`;
}

function formatGameMode(rounds) {
    if (!rounds || rounds === 0) {
        return 'Classic Elimination (Capture all cards to win)';
    }
    return `${rounds} Rounds (Top cards at Rd ${rounds} wins)`;
}

function updateLobbyRulesPreview(data) {
    const themeEl = document.getElementById('lobby-theme-val');
    const cardsEl = document.getElementById('lobby-cards-val');
    const modeEl  = document.getElementById('lobby-mode-val');

    const c   = data.concept || currentConcept || 'ben10';
    const cpp = (data.cardsPerPlayer !== undefined) ? data.cardsPerPlayer : currentCardsPerPlayer;
    const mr  = (data.maxRounds !== undefined) ? data.maxRounds : currentMaxRounds;

    currentConcept        = c;
    currentCardsPerPlayer = cpp;
    currentMaxRounds      = mr;

    if (themeEl) themeEl.innerText = formatConceptName(c);
    if (cardsEl) cardsEl.innerText = formatCardsPerPlayer(cpp);
    if (modeEl)  modeEl.innerText  = formatGameMode(mr);
}

// ─── IN-GAME RULES HUD & MODAL UPDATER ──────────────────────────────────
function updateInGameRulesHUD(data) {
    const hudModeText        = document.getElementById('hud-mode-text');
    const roundDenominator   = document.getElementById('round-limit-denominator');
    const roundMilestoneHint = document.getElementById('round-milestone-hint');

    const mr  = (data.maxRounds !== undefined) ? data.maxRounds : currentMaxRounds;
    const cpp = (data.cardsPerPlayer !== undefined) ? data.cardsPerPlayer : currentCardsPerPlayer;
    const rNum = data.roundCount || 1;

    currentMaxRounds      = mr;
    currentCardsPerPlayer = cpp;

    if (hudModeText) {
        if (mr > 0) {
            hudModeText.innerText = `${mr} Rounds Mode`;
        } else {
            hudModeText.innerText = 'Classic Elimination';
        }
    }

    if (roundDenominator) {
        if (mr > 0) {
            roundDenominator.innerText = `/ ${mr}`;
            roundDenominator.classList.remove('hidden');
        } else {
            roundDenominator.classList.add('hidden');
        }
    }

    if (roundMilestoneHint) {
        if (mr > 0) {
            roundMilestoneHint.innerText = `(Top player at Rd ${mr} wins!)`;
        } else {
            const nextMilestone = Math.ceil(Math.max(rNum, 1) / 10) * 10;
            roundMilestoneHint.innerText = `(Next Leaderboard: Rd ${nextMilestone})`;
        }
    }

    // Modal contents
    const modalModeTag    = document.getElementById('modal-rule-mode-tag');
    const modalCardsTag   = document.getElementById('modal-rule-cards-tag');
    const modalWinSummary = document.getElementById('modal-rule-win-summary');

    if (modalModeTag) {
        modalModeTag.innerText = mr > 0 ? `${mr} ROUNDS TOURNAMENT` : 'CLASSIC ELIMINATION';
    }
    if (modalCardsTag) {
        modalCardsTag.innerText = cpp > 0 ? `${cpp} CARDS / PLAYER` : 'FULL DECK';
    }
    if (modalWinSummary) {
        if (mr > 0) {
            modalWinSummary.innerHTML = `🏆 <strong>Win Condition:</strong> Whichever player holds the most cards at the conclusion of <strong>Round ${mr}</strong> wins the entire match!`;
        } else {
            modalWinSummary.innerHTML = `🏆 <strong>Win Condition:</strong> Battle until one player captures all cards from all opponents to achieve complete multiverse victory!`;
        }
    }
}

// ─── LOBBY EVENTS ────────────────────────────────────────────────────────
btnCreateRoom.addEventListener('click', () => {
    if (!playerNameInput.value.trim()) return showError('Please enter your name');
    joinSection.classList.add('hidden');
    createRoomDetails.classList.remove('hidden');
});

btnBackCreate.addEventListener('click', () => {
    createRoomDetails.classList.add('hidden');
    joinSection.classList.remove('hidden');
});

btnGenerateLobby.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) return showError('Please enter your name');
    isHost = true;
    socket.emit('create_room', {
        playerName,
        concept: selectedConcept,
        cardsPerPlayer: selectedCardsPerPlayer,
        maxRounds: selectedMaxRounds
    });
});

btnJoinRoom.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    const roomCode   = roomCodeInput.value.trim().toUpperCase();
    if (!playerName) return showError('Please enter your name');
    if (!roomCode)   return showError('Please enter a room code');
    isHost = false;
    socket.emit('join_room', { playerName, roomCode });
});

btnCopyLink.addEventListener('click', () => {
    const link = `${window.location.origin}/?room=${currentRoomCode}`;
    navigator.clipboard.writeText(link).then(() => {
        const old = btnCopyLink.innerText;
        btnCopyLink.innerText = 'Copied!';
        setTimeout(() => btnCopyLink.innerText = old, 2000);
    });
});

btnStartGame.addEventListener('click', () => {
    if (isHost) socket.emit('start_game', { roomCode: currentRoomCode });
});

if (btnBackLobby) {
    btnBackLobby.addEventListener('click', () => {
        clearSession();
    });
}

function showLobbyWaitScreen(data) {
    joinSection.classList.add('hidden');
    createRoomDetails.classList.add('hidden');
    lobbyWait.classList.remove('hidden');
    displayRoomCode.innerText = data.roomCode;
    updatePlayersList(data.players);
    updateLobbyRulesPreview(data);
}

function updatePlayersList(players) {
    playerCount.innerText = players.length;
    playersList.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = p.name + (p.isHost ? ' (Host)' : '') + (!p.connected && p.connected !== undefined ? ' 🔴 disconnected' : '');
        playersList.appendChild(li);
    });
}

// ─── SOCKET: ROOM EVENTS ──────────────────────────────────────────────────
socket.on('room_created', (data) => {
    currentRoomCode = data.roomCode;
    isHost = true;
    saveSession(data.sessionToken, data.roomCode, playerNameInput.value.trim(), true);
    showLobbyWaitScreen(data);
    btnStartGame.classList.remove('disabled');
    btnStartGame.disabled = false;
    lobbyStatusMsg.innerText = 'You are the host. Start when everyone is here!';
    rejoinBanner.classList.add('hidden');
    updateChatRoomTag(data.roomCode);
    currentPlayers = data.players || [];
    renderPlayersRoster(currentPlayers, currentActivePlayerId);
});

socket.on('room_joined', (data) => {
    currentRoomCode = data.roomCode;
    saveSession(data.sessionToken, data.roomCode, playerNameInput.value.trim(), false);
    showLobbyWaitScreen(data);
    rejoinBanner.classList.add('hidden');
    updateChatRoomTag(data.roomCode);
    currentPlayers = data.players || [];
    renderPlayersRoster(currentPlayers, currentActivePlayerId);
});

socket.on('player_joined', (data) => {
    updatePlayersList(data.players);
    updateLobbyRulesPreview(data);
    currentPlayers = data.players || [];
    renderPlayersRoster(currentPlayers, currentActivePlayerId);
});
socket.on('player_left',   (data) => {
    updatePlayersList(data.players);
    currentPlayers = data.players || [];
    renderPlayersRoster(currentPlayers, currentActivePlayerId);
});
socket.on('player_status_changed', (data) => {
    if (data.players) {
        currentPlayers = data.players;
        renderPlayersRoster(currentPlayers, currentActivePlayerId);
    }
});
socket.on('error',         (msg)  => { showError(msg); });

socket.on('game_message', (data) => {
    if (turnIndicator) {
        const prev = turnIndicator.innerText;
        turnIndicator.innerText = data.msg;
        setTimeout(() => { turnIndicator.innerText = prev; }, 4000);
    }
});

// ─── SOCKET: REJOIN ───────────────────────────────────────────────────────
socket.on('rejoined', (data) => {
    if (btnRejoin) { btnRejoin.disabled = false; btnRejoin.textContent = '↩ Rejoin'; }
    currentRoomCode = data.roomCode;
    mySessionToken  = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}').sessionToken;
    rejoinBanner.classList.add('hidden');
    updateChatRoomTag(data.roomCode);
    updateLobbyRulesPreview(data);
    updateInGameRulesHUD(data);
    currentPlayers = data.players || [];
    renderPlayersRoster(currentPlayers, currentActivePlayerId);

    if (data.gameState === 'playing') {
        lobbyWrapper.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        startBackgroundMusic();
        socket.emit('request_game_state');
    } else if (data.gameState === 'lobby') {
        lobbyWrapper.classList.remove('hidden');
        showLobbyWaitScreen(data);
        // Restore host button if applicable
        try {
            const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (saved && saved.isHost) {
                isHost = true;
                btnStartGame.classList.remove('disabled');
                btnStartGame.disabled = false;
                lobbyStatusMsg.innerText = 'You are the host. Start when everyone is here!';
            }
        } catch (e) {}
    }
});

socket.on('rejoin_failed', (data) => {
    if (btnRejoin) { btnRejoin.disabled = false; btnRejoin.textContent = '↩ Rejoin'; }
    clearSession();
    showError(data.reason || 'Could not rejoin. Please start fresh.');
});

// ─── SOCKET: GAME START ───────────────────────────────────────────────────
socket.on('game_started', () => {
    lobbyWrapper.classList.add('hidden');
    startBackgroundMusic();
    playShuffleAnimation();
});

// ─── SHUFFLE ANIMATION ENGINE ────────────────────────────────────────────
function playShuffleAnimation() {
    shuffleOverlay.classList.remove('hidden', 'fade-out');
    shuffleDeckArea.innerHTML = '';
    shuffleTitle.innerText    = 'SHUFFLING DECK';
    shuffleSubtitle.innerText = 'Preparing your battle cards...';

    const CARD_COUNT = 12;
    const cards = [];
    for (let i = 0; i < CARD_COUNT; i++) {
        const card = document.createElement('div');
        card.className = 'shuffle-card';
        card.style.zIndex     = i;
        card.style.transform  = `translate(-50%, -50%) translateY(${-i * 2}px) rotate(${(Math.random() - 0.5) * 3}deg)`;
        card.innerHTML = `<div class="shuffle-card-inner"><div class="shuffle-card-symbol"></div><div class="shuffle-card-logo">NEXUS</div></div>`;
        shuffleDeckArea.appendChild(card);
        cards.push(card);
    }

    let shuffleCount = 0;
    const maxShuffles = 6;

    function doRiffle() {
        if (shuffleCount >= maxShuffles) {
            setTimeout(() => dealCards(cards), 300);
            return;
        }
        cards.forEach((card, i) => {
            card.classList.remove('riffle-left', 'riffle-right', 'shuffling');
            void card.offsetWidth;
            setTimeout(() => {
                card.classList.add(i % 2 === 0 ? 'riffle-left' : 'riffle-right');
            }, i * 30);
        });
        setTimeout(() => {
            cards.forEach((card) => {
                card.classList.remove('riffle-left', 'riffle-right');
                const newIdx = Math.floor(Math.random() * CARD_COUNT);
                card.style.zIndex    = newIdx;
                card.style.transform = `translate(-50%, -50%) translateY(${-newIdx * 2}px) rotate(${(Math.random() - 0.5) * 4}deg)`;
            });
            shuffleCount++;
            setTimeout(doRiffle, 100);
        }, 400);
    }
    setTimeout(doRiffle, 500);
}

function dealCards(cards) {
    shuffleTitle.innerText    = 'DEALING CARDS';
    shuffleSubtitle.innerText = 'Distributing cards to players...';

    const burst = document.createElement('div');
    burst.className = 'glow-burst';
    shuffleDeckArea.appendChild(burst);

    const totalCards = cards.length;
    cards.forEach((card, i) => {
        setTimeout(() => {
            const angle    = ((i / totalCards) * 360) * (Math.PI / 180);
            const distance = 300 + Math.random() * 150;
            const tx  = Math.cos(angle) * distance;
            const ty  = Math.sin(angle) * distance;
            const rot = (i / totalCards * 360) + (Math.random() - 0.5) * 30;
            card.classList.add('dealing');
            card.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg) scale(0.5)`;
            card.style.opacity   = '0';
            card.style.transition = `all ${0.6 + Math.random() * 0.3}s cubic-bezier(0.23, 1, 0.32, 1)`;
        }, i * 80);
    });

    const totalDealTime = (cards.length * 80) + 800;
    setTimeout(() => {
        shuffleOverlay.classList.add('fade-out');
        setTimeout(() => {
            shuffleOverlay.classList.add('hidden');
            shuffleOverlay.classList.remove('fade-out');
            shuffleDeckArea.innerHTML = '';
            socket.emit('request_game_state');
        }, 800);
    }, totalDealTime);
}

// ─── MAIN GAME STATE UPDATE ───────────────────────────────────────────────
socket.on('game_state_update', (data) => {
    gameContainer.classList.remove('hidden');
    arena.classList.add('hidden');
    if (leaderboardOverlay) leaderboardOverlay.classList.add('hidden');
    if (lbPresentation)     lbPresentation.classList.add('hidden');
    if (leaderPresentationTimeout) { clearTimeout(leaderPresentationTimeout); leaderPresentationTimeout = null; }
    if (leaderboardCountdownTimer) { clearInterval(leaderboardCountdownTimer); leaderboardCountdownTimer = null; }
    if (lbVideo) { lbVideo.pause(); lbVideo.currentTime = 0; }
    if (tieAutoCloseTimer) { clearTimeout(tieAutoCloseTimer); tieAutoCloseTimer = null; }

    const { players, activePlayerId, myTopCard, stats_keys, concept, myCards, tiedParameters, roundCount, eliminated } = data;
    amIActive             = (socket.id === activePlayerId);
    currentTopCard        = myTopCard;
    currentConcept        = concept || 'ben10';
    currentStatsKeys      = stats_keys || ['attack', 'strength', 'speed', 'durability'];
    currentTiedParameters = tiedParameters || [];

    // Sync HUD mode & round settings
    updateInGameRulesHUD(data);

    // Round Counter
    if (currentRoundDisplay) {
        const rNum = roundCount || 1;
        currentRoundDisplay.innerText = rNum;
    }

    // Card count & score
    let myCount = 0, myScore = 0;
    players.forEach(p => {
        if (p.id === socket.id) {
            myCount = p.cardCount;
            myScore = p.scoreCount || 0;
            window.myPlayerName = p.name;
        }
    });
    myCardCount.innerText = myCount + (myScore > 0 ? ` (Won: ${myScore})` : '');

    // Turn indicator & offline opponent check
    const activeOnlinePlayers = players.filter(p => (p.cardCount || 0) > 0 && p.connected !== false);
    if (activeOnlinePlayers.length < 2 && !eliminated) {
        handleSoloOnlinePlayer(activeOnlinePlayers);
    } else {
        stopSoloCountdown();
        if (soloPromptModal) soloPromptModal.classList.add('hidden');
        turnIndicator.className = amIActive ? 'turn-indicator your-turn' : 'turn-indicator';
        if (eliminated) {
            turnIndicator.innerText = '💀 You are eliminated! Spectating...';
            turnIndicator.className = 'turn-indicator';
        } else if (amIActive) {
            turnIndicator.innerText = currentTiedParameters.length > 0
                ? '⚡ Tie! Select a DIFFERENT stat to break the tie.'
                : '⚡ Your Turn! Select a stat to battle.';
        } else {
            const activePlayerObj = players.find(p => p.id === activePlayerId);
            const activePlayerName = activePlayerObj ? activePlayerObj.name : 'active player';
            turnIndicator.innerText = currentTiedParameters.length > 0
                ? `⚠️ Tie! Waiting for ${activePlayerName}...`
                : `👤 Turn: ${activePlayerName}`;
        }
    }

    // Eliminated overlay
    if (eliminatedOverlay) {
        eliminated
            ? eliminatedOverlay.classList.remove('hidden')
            : eliminatedOverlay.classList.add('hidden');
    }

    // Render card or hide if eliminated
    if (myTopCard && !eliminated) {
        renderCard(myTopCard, concept, stats_keys, amIActive, currentTiedParameters);
    } else if (eliminated) {
        myActiveCardContainer.style.display = 'none';
    }

    // Bottom deck panel
    if (myCards) renderMyDeck(myCards);

    // Update side drawers: roster & sync
    currentPlayers = players || [];
    currentActivePlayerId = activePlayerId;
    renderPlayersRoster(currentPlayers, currentActivePlayerId);
});

// ─── SELECT PARAMETER ─────────────────────────────────────────────────────
function selectParameter(paramKey) {
    if (!amIActive) return;
    if (currentTiedParameters.includes(paramKey)) {
        showError(`Stat '${paramKey.toUpperCase()}' was already tied! Pick a different stat.`);
        return;
    }
    amIActive = false;
    myActiveCardContainer.classList.remove('is-active-turn');
    socket.emit('select_parameter', { parameter: paramKey });
}

// ─── TIE ARENA ───────────────────────────────────────────────────────────
function closeTieArena(lastTiedParam) {
    if (tieAutoCloseTimer) { clearTimeout(tieAutoCloseTimer); tieAutoCloseTimer = null; }
    arena.classList.add('hidden');
    btnBreakTie.classList.add('hidden');
    if (currentTopCard) renderCard(currentTopCard, currentConcept, currentStatsKeys, amIActive, currentTiedParameters);
    if (amIActive) {
        const paramText = lastTiedParam ? lastTiedParam.toUpperCase() : 'STAT';
        turnIndicator.innerText = `⚡ Tie on ${paramText}! Select a DIFFERENT stat.`;
        turnIndicator.className = 'turn-indicator your-turn';
        myActiveCardContainer.classList.add('is-active-turn');
    } else {
        const paramText = lastTiedParam ? lastTiedParam.toUpperCase() : 'stat';
        const activePlayerObj = (currentPlayers || []).find(p => p.id === currentActivePlayerId);
        const activePlayerName = activePlayerObj ? activePlayerObj.name : 'active player';
        turnIndicator.innerText = `⚠️ Tie on ${paramText}! Waiting for ${activePlayerName}...`;
        turnIndicator.className = 'turn-indicator';
        myActiveCardContainer.classList.remove('is-active-turn');
    }
}

if (btnBreakTie) {
    btnBreakTie.addEventListener('click', () => {
        const lastParam = currentTiedParameters.length > 0
            ? currentTiedParameters[currentTiedParameters.length - 1] : '';
        closeTieArena(lastParam);
    });
}

socket.on('tie_result', (data) => {
    const { parameter, tiedParameters, revealedCards, activePlayerId, tiedPlayers } = data;
    currentTiedParameters = tiedParameters || [parameter];
    amIActive = (socket.id === activePlayerId);
    if (tieAutoCloseTimer) { clearTimeout(tieAutoCloseTimer); tieAutoCloseTimer = null; }

    arena.classList.remove('hidden');
    document.getElementById('arena-title').innerText = `Tie: ${parameter.toUpperCase()}`;
    arenaCards.innerHTML = '';

    revealedCards.forEach((c, index) => {
        const isMyCard = (c.playerName === window.myPlayerName);
        setTimeout(() => {
            const div     = document.createElement('div');
            div.className = `arena-flip-container ${isMyCard ? 'flipped' : ''}`;
            const isTied  = tiedPlayers.includes(c.playerName);
            const cardImg = isMyCard ? (c.card.image || '') : '/images/tied_silhouette.png';
            const cardName = isMyCard ? (c.card.name || '?') : '???';
            const imgClass = isMyCard ? '' : 'is-tied-silhouette';
            div.innerHTML = `
                <div class="arena-card-inner">
                    <div class="arena-card-face arena-front"><div class="card-back-design"></div></div>
                    <div class="arena-card-face arena-back arena-card ${isTied ? 'is-winner' : ''}">
                        <img src="${cardImg}" alt="${cardName}" class="${imgClass}" onerror="this.src='/images/tied_silhouette.png'">
                        <div class="name">${c.playerName}</div>
                        <div class="card-name">${cardName}</div>
                        <div class="val">
                            ${c.value}${isTied ? ' ⚠️' : ''}
                            <div class="val-label highlight-param">${parameter.toUpperCase()} (TIED)</div>
                        </div>
                    </div>
                </div>`;
            arenaCards.appendChild(div);
            if (!isMyCard) setTimeout(() => { div.classList.add('flipped'); }, 500 + (index * 400));
        }, index * 200);
    });

    winnerText.innerText = `⚠️ Tie between: ${tiedPlayers.join(', ')}!`;
    btnNextRound.classList.add('hidden');
    const totalAnimDelay = 600 + (revealedCards.length * 200);
    setTimeout(() => {
        if (amIActive) {
            btnBreakTie.classList.remove('hidden');
            winnerText.innerText = `⚠️ Tie! Click below or wait to choose another stat.`;
        } else {
            btnBreakTie.classList.add('hidden');
            const activePlayerObj = (currentPlayers || []).find(p => p.id === currentActivePlayerId);
            const activePlayerName = activePlayerObj ? activePlayerObj.name : 'active player';
            winnerText.innerText = `⚠️ Tie! Waiting for ${activePlayerName} to pick another stat...`;
        }
    }, totalAnimDelay);

    tieAutoCloseTimer = setTimeout(() => closeTieArena(parameter), totalAnimDelay + 3500);
});

socket.on('all_tied_result', (data) => {
    if (tieAutoCloseTimer) { clearTimeout(tieAutoCloseTimer); tieAutoCloseTimer = null; }
    currentTiedParameters = [];
    arena.classList.remove('hidden');
    document.getElementById('arena-title').innerText = 'ALL STATS TIED!';
    winnerText.innerText = data.message || 'All stats tied! Cards moved to the bottom of each deck.';
    btnBreakTie.classList.add('hidden');
    btnNextRound.classList.add('hidden');
    setTimeout(() => {
        arena.classList.add('hidden');
        socket.emit('request_game_state');
    }, 3500);
});

// ─── ALIEN CELEBRATION BLAST (FOR SET WINNER ONLY) ────────────────────────
const ALIEN_IMAGES = [
    '/images/aliens/alien_x.png', '/images/aliens/ampfibian.png', '/images/aliens/arctiguana.png',
    '/images/aliens/armodrillo.png', '/images/aliens/ball_weevil.png', '/images/aliens/big_chill.png',
    '/images/aliens/blitzwolfer.png', '/images/aliens/bloxx.png', '/images/aliens/brainstorm.png',
    '/images/aliens/cannonbolt.png', '/images/aliens/chamalien.png', '/images/aliens/chromastone.png',
    '/images/aliens/clockwork.png', '/images/aliens/crashhopper.png', '/images/aliens/diamondhead.jpeg',
    '/images/aliens/ditto.png', '/images/aliens/eatle.png', '/images/aliens/echo_echo.png',
    '/images/aliens/eye_guy.png', '/images/aliens/fasttrack.png', '/images/aliens/feedback.png',
    '/images/aliens/four_arms.png', '/images/aliens/frankenstrike.png', '/images/aliens/ghostfreak.png',
    '/images/aliens/goop.png', '/images/aliens/gravattack.png', '/images/aliens/grey_matter.png',
    '/images/aliens/heatblast.png', '/images/aliens/humungousaur.png', '/images/aliens/jetray.png',
    '/images/aliens/jury_rigg.png', '/images/aliens/lodestar.png', '/images/aliens/nanomech.png',
    '/images/aliens/nrg.png', '/images/aliens/pesky_dust.png', '/images/aliens/rath.png',
    '/images/aliens/ripjaws.png', '/images/aliens/shocksquatch.png', '/images/aliens/snare_oh.png',
    '/images/aliens/spider_monkey.png', '/images/aliens/stinkfly.png', '/images/aliens/swampfire.png',
    '/images/aliens/terraspin.png', '/images/aliens/the_worst.png', '/images/aliens/ultimate_big_chill.png',
    '/images/aliens/ultimate_cannonbolt.png', '/images/aliens/ultimate_echo_echo.png',
    '/images/aliens/ultimate_humungousaur.png', '/images/aliens/ultimate_spider_monkey.png',
    '/images/aliens/ultimate_swampfire.png', '/images/aliens/ultimate_way_big.png',
    '/images/aliens/ultimate_wildmutt.png', '/images/aliens/upchuck.png', '/images/aliens/upgrade.png',
    '/images/aliens/water_hazard.png', '/images/aliens/way_big.png', '/images/aliens/wildmutt.png',
    '/images/aliens/wildvine.png', '/images/aliens/xlr8.png'
];

function triggerWinnerAlienBlast() {
    let container = document.getElementById('alien-blast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alien-blast-container';
        container.className = 'alien-blast-container';
        document.body.appendChild(container);
    }

    // Flash celebratory banner for the winner
    const flash = document.createElement('div');
    flash.className = 'winner-blast-flash';
    flash.innerHTML = '⚡ YOU WON THIS SET! 🏆';
    container.appendChild(flash);
    setTimeout(() => { flash.remove(); }, 2000);

    // Pick origin from winning card if visible, else center of screen
    const winnerCardEl = document.querySelector('.arena-card.is-winner');
    const rect = winnerCardEl ? winnerCardEl.getBoundingClientRect() : null;
    const originX = (rect && rect.width > 0) ? (rect.left + rect.width / 2) : (window.innerWidth / 2);
    const originY = (rect && rect.height > 0) ? (rect.top + rect.height / 2) : (window.innerHeight * 0.45);

    // Shuffle alien images to burst all combined alien photos
    const shuffled = [...ALIEN_IMAGES].sort(() => 0.5 - Math.random());
    const count = 45; // 45 small-sized alien tokens

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'alien-blast-particle';

            const alienSrc = shuffled[i % shuffled.length];
            const img = document.createElement('img');
            img.src = alienSrc;
            img.alt = 'Alien Blast';
            img.onerror = () => { particle.style.display = 'none'; };
            particle.appendChild(img);

            // 360 degree explosion with random distance and slight gravity drift
            const angle = Math.random() * Math.PI * 2;
            const dist = 120 + Math.random() * 380;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const rot = `${(Math.random() - 0.5) * 400}deg`;
            const dur = `${1.8 + Math.random() * 1.0}s`;
            const size = `${34 + Math.random() * 14}px`; // Small sized aliens (34px - 48px)

            particle.style.width = size;
            particle.style.height = size;
            particle.style.left = `${originX}px`;
            particle.style.top = `${originY}px`;
            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);
            particle.style.setProperty('--rot', rot);
            particle.style.setProperty('--dur', dur);

            container.appendChild(particle);

            setTimeout(() => { particle.remove(); }, 3000);
        }, Math.floor(i / 15) * 140 + Math.random() * 70);
    }
}

socket.on('round_result', (data) => {
    const { parameter, revealedCards, winnerName, winnerId } = data;
    if (tieAutoCloseTimer) { clearTimeout(tieAutoCloseTimer); tieAutoCloseTimer = null; }
    currentTiedParameters = [];
    btnBreakTie.classList.add('hidden');

    arena.classList.remove('hidden');
    document.getElementById('arena-title').innerText = `Battle: ${parameter.toUpperCase()}`;
    arenaCards.innerHTML = '';

    revealedCards.forEach((c, index) => {
        const isMyCard  = (c.playerName === window.myPlayerName);
        const isWinner  = c.playerName === winnerName;
        setTimeout(() => {
            const div     = document.createElement('div');
            div.className = `arena-flip-container ${isMyCard ? 'flipped' : ''}`;
            div.innerHTML = `
                <div class="arena-card-inner">
                    <div class="arena-card-face arena-front"><div class="card-back-design"></div></div>
                    <div class="arena-card-face arena-back arena-card ${isWinner ? 'is-winner' : ''}">
                        <img src="${c.card.image}" alt="${c.card.name}" onerror="this.style.display='none'">
                        <div class="name">${c.playerName}</div>
                        <div class="card-name">${c.card.name || '?'}</div>
                        <div class="val">
                            ${c.value}${isWinner ? ' 🏆' : ''}
                            <div class="val-label highlight-param">${parameter.toUpperCase()}</div>
                        </div>
                    </div>
                </div>`;
            arenaCards.appendChild(div);
            if (!isMyCard) setTimeout(() => { div.classList.add('flipped'); }, 500 + (index * 400));
        }, index * 200);
    });

    winnerText.innerText = `🏆 Winner: ${winnerName}!`;
    const isMeWinner = (winnerName === window.myPlayerName || (winnerId && socket.id === winnerId));
    
    // Only show small-sized alien blast to the winning player!
    if (isMeWinner) {
        const totalRevealDelay = 500 + (revealedCards.length * 300);
        setTimeout(() => {
            triggerWinnerAlienBlast();
        }, totalRevealDelay);
    }

    const canAdvance = (socket.id === winnerId) || isHost;
    btnNextRound.classList.toggle('hidden', !canAdvance);

    // Auto-advance safety net: if winner is offline or doesn't click within 7s, auto-advance
    clearTimeout(window.roundAutoAdvanceTimer);
    window.roundAutoAdvanceTimer = setTimeout(() => {
        if (!arena.classList.contains('hidden') && btnBreakTie.classList.contains('hidden')) {
            socket.emit('next_round');
        }
    }, 7000);
});

// ─── NEXT ROUND BUTTON ────────────────────────────────────────────────────
if (btnNextRound) {
    btnNextRound.addEventListener('click', () => {
        clearTimeout(window.roundAutoAdvanceTimer);
        btnNextRound.classList.add('hidden');
        const blastContainer = document.getElementById('alien-blast-container');
        if (blastContainer) blastContainer.innerHTML = '';
        const deckRect = myDeckList ? myDeckList.getBoundingClientRect() : null;
        const cards    = document.querySelectorAll('.arena-flip-container');
        if (deckRect && cards.length > 0) {
            cards.forEach((card, idx) => {
                setTimeout(() => {
                    const rect  = card.getBoundingClientRect();
                    const moveX = (deckRect.right - 50) - (rect.left + rect.width / 2);
                    const moveY = (deckRect.top + 20)  - (rect.top  + rect.height / 2);
                    card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease-in';
                    card.style.transform  = `translate(${moveX}px, ${moveY}px) scale(0.2)`;
                    card.style.opacity    = '0';
                }, idx * 150);
            });
        }
        const totalDelay = 600 + (cards.length * 150);
        setTimeout(() => { socket.emit('next_round'); }, totalDelay);
    });
}

// ─── LEADERBOARD / MILESTONE ──────────────────────────────────────────────
let currentLeaderboardData = null;

function renderLeaderboard(data) {
    currentLeaderboardData = data;
    const { round, nextRound, milestone, leaderboard } = data;

    arena.classList.add('hidden');
    isLeaderPresented = false;
    if (leaderPresentationTimeout) { clearTimeout(leaderPresentationTimeout); leaderPresentationTimeout = null; }
    if (leaderboardCountdownTimer) { clearInterval(leaderboardCountdownTimer); leaderboardCountdownTimer = null; }

    // Completely stop and hide intermediate video cutscene
    if (lbVideo) {
        lbVideo.pause();
        lbVideo.currentTime = 0;
        lbVideo.removeAttribute('src');
        if (lbVideoSource) lbVideoSource.removeAttribute('src');
    }
    if (cinemaProgressContainer) cinemaProgressContainer.classList.add('hidden');
    if (cinemaHudTop)            cinemaHudTop.classList.add('hidden');
    if (btnSkipVideo)            btnSkipVideo.style.display = 'none';
    if (btnReplayVideo)          btnReplayVideo.style.display = 'none';

    if (lbMilestoneTag) lbMilestoneTag.innerText = `⚡ ROUND ${round} MILESTONE`;
    if (lbNextRoundNum) lbNextRoundNum.innerText  = nextRound || (round + 1);

    if (leaderboard && leaderboard.length > 0) {
        const leader = leaderboard[0];
        if (leaderTopName)  leaderTopName.innerText  = leader.name;
        if (leaderTopScore) leaderTopScore.innerText = leader.score;
        if (leaderTopDeck)  leaderTopDeck.innerText  = leader.cardCount;
    }

    if (lbPlayersList && leaderboard) {
        lbPlayersList.innerHTML = '';
        leaderboard.forEach((p, idx) => {
            const rank      = idx + 1;
            const isMe      = (p.id === socket.id || p.name === window.myPlayerName);
            const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
            const medal     = rank === 1 ? '👑' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));
            const div = document.createElement('div');
            div.className = `lb-player-card ${rankClass}${isMe ? ' is-me' : ''}`;
            div.innerHTML = `
                <div class="lb-player-left">
                    <div class="lb-rank-badge">${medal}</div>
                    <div class="lb-player-name-group">
                        <span class="lb-player-name">
                            ${p.name} ${isMe ? '<span class="lb-you-tag">YOU</span>' : ''}
                        </span>
                    </div>
                </div>
                <div class="lb-player-right">
                    <span class="lb-score-pill">🏆 ${p.score} Won</span>
                    <span class="lb-deck-pill">🎴 ${p.cardCount} In Deck</span>
                </div>`;
            lbPlayersList.appendChild(div);
        });
    }

    // Show leaderboard overlay and immediately present standings (no video)
    if (leaderboardOverlay) leaderboardOverlay.classList.remove('hidden');
    presentLeader();
}

function presentLeader() {
    if (isLeaderPresented) return;
    isLeaderPresented = true;
    if (leaderPresentationTimeout) { clearTimeout(leaderPresentationTimeout); leaderPresentationTimeout = null; }

    if (lbPresentation) lbPresentation.classList.remove('hidden');
    if (btnReplayVideo) btnReplayVideo.style.display = 'none';

    if (leaderboardCountdownTimer) clearInterval(leaderboardCountdownTimer);
    leaderboardCountdownSeconds = 10;
    if (lbCountdownNum) lbCountdownNum.innerText = leaderboardCountdownSeconds;

    leaderboardCountdownTimer = setInterval(() => {
        leaderboardCountdownSeconds--;
        if (lbCountdownNum) lbCountdownNum.innerText = leaderboardCountdownSeconds;
        if (leaderboardCountdownSeconds <= 0) resumeFromLeaderboard();
    }, 1000);
}

if (lbVideo) {
    lbVideo.addEventListener('timeupdate', () => {
        if (lbVideo.duration && cinemaProgressBar) {
            cinemaProgressBar.style.width = `${(lbVideo.currentTime / lbVideo.duration) * 100}%`;
            if (lbVideo.currentTime >= lbVideo.duration - 0.35 && !isLeaderPresented) presentLeader();
        }
    });
    lbVideo.addEventListener('ended', () => { presentLeader(); });
}

if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lbVideo) {
            lbVideo.muted = !lbVideo.muted;
            btnSoundToggle.innerText = lbVideo.muted ? '🔊 Unmute' : '🔇 Mute';
        }
    });
}

if (btnSkipVideo) {
    btnSkipVideo.addEventListener('click', (e) => { e.stopPropagation(); presentLeader(); });
}

if (btnReplayVideo) {
    btnReplayVideo.addEventListener('click', (e) => {
        e.stopPropagation();
        if (leaderboardCountdownTimer) { clearInterval(leaderboardCountdownTimer); leaderboardCountdownTimer = null; }
        isLeaderPresented = false;
        if (lbPresentation)   lbPresentation.classList.add('hidden');
        if (cinemaHudTop)     cinemaHudTop.classList.remove('dimmed');
        if (btnSkipVideo)     btnSkipVideo.style.display = 'inline-flex';
        if (cinemaProgressBar) cinemaProgressBar.style.width = '0%';
        if (lbVideo) {
            lbVideo.classList.remove('blurred');
            lbVideo.loop = false;
            lbVideo.currentTime = 0;
            lbVideo.play().catch(() => {});
        }
    });
}

function resumeFromLeaderboard() {
    if (leaderPresentationTimeout) { clearTimeout(leaderPresentationTimeout); leaderPresentationTimeout = null; }
    if (leaderboardCountdownTimer) { clearInterval(leaderboardCountdownTimer); leaderboardCountdownTimer = null; }
    if (lbVideo) { lbVideo.pause(); lbVideo.currentTime = 0; lbVideo.loop = false; }
    if (leaderboardOverlay) leaderboardOverlay.classList.add('hidden');
    if (lbPresentation)     lbPresentation.classList.add('hidden');
    socket.emit('resume_from_leaderboard');
}

if (btnResumeBattle) {
    btnResumeBattle.addEventListener('click', () => { resumeFromLeaderboard(); });
}

socket.on('show_leaderboard', (data) => { renderLeaderboard(data); });

// ─── GAME OVER ────────────────────────────────────────────────────────────
socket.on('game_over', (data) => {
    // Stop leaderboard if it was showing
    if (leaderPresentationTimeout) { clearTimeout(leaderPresentationTimeout); leaderPresentationTimeout = null; }
    if (leaderboardCountdownTimer) { clearInterval(leaderboardCountdownTimer); leaderboardCountdownTimer = null; }
    if (leaderboardOverlay) leaderboardOverlay.classList.add('hidden');
    if (lbPresentation)     lbPresentation.classList.add('hidden');
    stopBackgroundMusic();

    // Show the game-over cinema overlay immediately
    gameContainer.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    if (gameoverResult) gameoverResult.classList.add('hidden');

    if (gameoverVideoEl && gameoverVideoSource && data.videoUrl) {
        gameoverVideoEl.muted = true;
        gameoverVideoSource.src = data.videoUrl;
        gameoverVideoEl.load();

        const showWinner = () => {
            if (gameoverResult) gameoverResult.classList.remove('hidden');
            if (gameWinnerEl)   gameWinnerEl.innerText = data.winnerName;
            const reasonEl = document.getElementById('gameover-reason');
            if (reasonEl) {
                reasonEl.innerText = data.reason || `${data.winnerName} is crowned Multiverse Champion!`;
            }
        };

        // Play after metadata loaded
        const onCanPlay = () => {
            const pp = gameoverVideoEl.play();
            if (pp !== undefined) pp.catch(() => showWinner());
        };
        gameoverVideoEl.addEventListener('canplaythrough', onCanPlay, { once: true });
        gameoverVideoEl.addEventListener('ended', showWinner, { once: true });

        // Fallback: if video doesn't load in 3s, just show winner
        setTimeout(() => {
            if (!gameoverVideoEl.paused) return;
            showWinner();
        }, 3000);
    } else {
        // No video — show winner directly
        if (gameoverResult) gameoverResult.classList.remove('hidden');
        if (gameWinnerEl)   gameWinnerEl.innerText = data.winnerName;
        const reasonEl = document.getElementById('gameover-reason');
        if (reasonEl) {
            reasonEl.innerText = data.reason || `${data.winnerName} is crowned Multiverse Champion!`;
        }
    }
});

// ─── BACK TO LOBBY ────────────────────────────────────────────────────────
if (btnBackLobby) {
    btnBackLobby.addEventListener('click', () => {
        clearSession();
        window.location.href = '/';
    });
}

// ============================================================
// HUD SIDE DRAWERS & BATTLE CHAT IMPLEMENTATION
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateBackdrop() {
    // Backdrop is permanently disabled so drawers never block interaction with cards or game controls
    if (drawerBackdrop) {
        drawerBackdrop.classList.add('hidden');
    }
}

function openPlayersDrawer() {
    if (!playersDrawer) return;
    playersDrawer.classList.add('is-open');
    if (window.innerWidth < 768 && chatDrawer) {
        chatDrawer.classList.remove('is-open');
    }
    updateBackdrop();
}

function closePlayersDrawer() {
    if (!playersDrawer) return;
    playersDrawer.classList.remove('is-open');
    updateBackdrop();
}

function openChatDrawer() {
    if (!chatDrawer) return;
    chatDrawer.classList.add('is-open');
    if (window.innerWidth < 768 && playersDrawer) {
        playersDrawer.classList.remove('is-open');
    }
    // Clear unread count
    unreadChatCount = 0;
    if (dockChatUnreadBadge) {
        dockChatUnreadBadge.classList.add('hidden');
        dockChatUnreadBadge.innerText = '0';
    }
    updateBackdrop();
    if (chatInputText) {
        setTimeout(() => chatInputText.focus(), 150);
    }
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

function closeChatDrawer() {
    if (!chatDrawer) return;
    chatDrawer.classList.remove('is-open');
    updateBackdrop();
}

// Event Listeners for Drawers
if (btnTogglePlayersDrawer) {
    btnTogglePlayersDrawer.addEventListener('click', () => {
        if (playersDrawer.classList.contains('is-open')) {
            closePlayersDrawer();
        } else {
            openPlayersDrawer();
        }
    });
}

if (btnClosePlayersDrawer) {
    btnClosePlayersDrawer.addEventListener('click', closePlayersDrawer);
}

if (btnToggleChatDrawer) {
    btnToggleChatDrawer.addEventListener('click', () => {
        if (chatDrawer.classList.contains('is-open')) {
            closeChatDrawer();
        } else {
            openChatDrawer();
        }
    });
}

if (btnCloseChatDrawer) {
    btnCloseChatDrawer.addEventListener('click', closeChatDrawer);
}

if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', () => {
        closePlayersDrawer();
        closeChatDrawer();
    });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePlayersDrawer();
        closeChatDrawer();
    }
});

// ─── RENDER PLAYERS ROSTER (SORTED DESCENDING BY CARD COUNT) ────────
function renderPlayersRoster(players, activePlayerId) {
    if (!drawerPlayersList || !players || players.length === 0) return;

    const onlineCount = players.filter(p => p.connected !== false).length;
    if (dockPlayersCountBadge) {
        dockPlayersCountBadge.innerText = onlineCount;
        dockPlayersCountBadge.title = `${onlineCount} of ${players.length} players online`;
    }

    // Dynamic sorting: player with the largest number of cards comes first!
    const sorted = [...players].sort((a, b) => {
        const diff = (b.cardCount || 0) - (a.cardCount || 0);
        if (diff !== 0) return diff;
        // Prioritize host on ties
        if (b.isHost && !a.isHost) return 1;
        if (a.isHost && !b.isHost) return -1;
        return (a.name || '').localeCompare(b.name || '');
    });

    drawerPlayersList.innerHTML = '';

    sorted.forEach((player, index) => {
        const isMe = (player.id === socket.id || player.name === window.myPlayerName);
        const isOnline = (player.connected !== false);
        const isLeader = (index === 0 && (player.cardCount || 0) > 0);
        const isTurn = (player.id === activePlayerId);

        const cardEl = document.createElement('div');
        cardEl.className = `roster-player-card${isLeader ? ' is-leader' : ''}${isTurn ? ' is-active-turn' : ''}${!isOnline ? ' is-offline' : ''}`;

        const initial = (player.name || '?').charAt(0).toUpperCase();

        cardEl.innerHTML = `
            <div class="roster-player-rank">${isLeader ? '👑' : `#${index + 1}`}</div>
            <div class="roster-avatar-wrap">
                <span>${initial}</span>
                <span class="status-dot roster-avatar-dot ${isOnline ? 'dot-online' : 'dot-offline'}" title="${isOnline ? 'Online' : 'Offline'}"></span>
            </div>
            <div class="roster-player-info">
                <div class="roster-name-row">
                    <span class="roster-player-name">${escapeHtml(player.name || 'Player')}</span>
                    ${player.isHost ? '<span class="roster-tag roster-tag-host">👑 HOST</span>' : ''}
                    ${isMe ? '<span class="roster-tag roster-tag-you">YOU</span>' : ''}
                    ${isTurn ? '<span class="roster-tag roster-tag-turn">⚡ TURN</span>' : ''}
                </div>
                <div class="roster-status-text ${isOnline ? 'is-online' : 'is-offline'}">
                    ${isOnline ? '● Online' : '○ Offline'}
                </div>
            </div>
            <div class="roster-cards-pill">
                <span class="roster-cards-count">${player.cardCount || 0}</span>
                <span class="roster-cards-label">CARDS</span>
            </div>
        `;
        drawerPlayersList.appendChild(cardEl);
    });
}

// ─── CHATBOX REAL-TIME COMMUNICATION ────────────────────────
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!chatInputText) return;
        const msg = chatInputText.value.trim();
        if (!msg) return;

        socket.emit('send_chat_message', { message: msg });
        chatInputText.value = '';
    });
}

socket.on('chat_message', (data) => {
    if (!chatMessagesContainer) return;

    const isMe = (data.senderId === socket.id || data.sender === window.myPlayerName);
    const item = document.createElement('div');

    if (data.isSystem) {
        item.className = 'chat-message-item chat-msg-system';
        item.innerHTML = `<span class="chat-msg-system-text">${escapeHtml(data.text)}</span>`;
    } else if (isMe) {
        item.className = 'chat-message-item chat-msg-me';
        item.innerHTML = `
            <div class="chat-sender-row">
                <span class="chat-time-tag">${escapeHtml(data.time || '')}</span>
                <span class="chat-sender-name">You</span>
            </div>
            <div class="chat-bubble">${escapeHtml(data.text)}</div>
        `;
    } else {
        item.className = 'chat-message-item chat-msg-them';
        item.innerHTML = `
            <div class="chat-sender-row">
                <span class="chat-sender-name">${escapeHtml(data.sender)}${data.isHost ? ' 👑' : ''}</span>
                <span class="chat-time-tag">${escapeHtml(data.time || '')}</span>
            </div>
            <div class="chat-bubble">${escapeHtml(data.text)}</div>
        `;
    }

    chatMessagesContainer.appendChild(item);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Unread notification badge if chat drawer is closed
    const isChatOpen = chatDrawer && chatDrawer.classList.contains('is-open');
    if (!isChatOpen && !isMe) {
        unreadChatCount++;
        if (dockChatUnreadBadge) {
            dockChatUnreadBadge.innerText = unreadChatCount > 99 ? '99+' : unreadChatCount;
            dockChatUnreadBadge.classList.remove('hidden');
        }
    }
});

// Update room code in chat header
function updateChatRoomTag(code) {
    const tag = document.getElementById('chat-room-code-tag');
    if (tag && code) tag.innerText = `#${code}`;
}

// ─── SOLO PLAYER / OPPONENTS OFFLINE COUNTDOWN & PROMPT ───────────────────
function handleSoloOnlinePlayer(activeOnlineList) {
    amIActive = false;
    if (myActiveCardContainer) myActiveCardContainer.classList.remove('is-active-turn');

    if (!soloCountdownTimer) {
        startSoloCountdown();
    }
}

function startSoloCountdown() {
    stopSoloCountdown();
    soloCountdownSeconds = 60;
    if (soloPromptModal) soloPromptModal.classList.add('hidden');

    if (turnIndicator) {
        turnIndicator.className = 'turn-indicator';
        turnIndicator.innerText = `⏳ All opponents offline. Waiting ${soloCountdownSeconds}s for reconnection...`;
    }

    soloCountdownTimer = setInterval(() => {
        soloCountdownSeconds--;
        if (turnIndicator) {
            turnIndicator.innerText = `⏳ All opponents offline. Waiting ${soloCountdownSeconds}s for reconnection...`;
        }

        if (soloCountdownSeconds <= 0) {
            stopSoloCountdown();
            showSoloPromptModal();
        }
    }, 1000);
}

function stopSoloCountdown() {
    if (soloCountdownTimer) {
        clearInterval(soloCountdownTimer);
        soloCountdownTimer = null;
    }
}

function showSoloPromptModal() {
    if (soloPromptModal) {
        soloPromptModal.classList.remove('hidden');
    }
    if (turnIndicator) {
        turnIndicator.innerText = '⚠️ Opponents still offline. Choice required...';
    }
}

// Button: Wait 1 more minute
if (btnSoloWait) {
    btnSoloWait.addEventListener('click', () => {
        if (soloPromptModal) soloPromptModal.classList.add('hidden');
        startSoloCountdown();
    });
}

// Button: End Game and declare winner based on highest card count
if (btnSoloEnd) {
    btnSoloEnd.addEventListener('click', () => {
        if (soloPromptModal) soloPromptModal.classList.add('hidden');
        stopSoloCountdown();
        socket.emit('end_game_solo');
    });
}

// ─── BEN 10 BACKGROUND CANVAS PARTICLE ENGINE ────────────────────────────
function initBen10BackgroundCanvas() {
    const canvas = document.getElementById('ben10-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const numParticles = Math.min(50, Math.floor((width * height) / 25000));
    const particles = [];
    const colors = ['#00ff41', '#00ffaa', '#39ff14', '#ccff00', '#00e676'];

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.5 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.6 - 0.2,
            alpha: Math.random() * 0.7 + 0.3,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulseFactor: Math.random() * Math.PI * 2
        });
    }

    function render() {
        ctx.clearRect(0, 0, width, height);

        // Draw connecting energy lines between close particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    const lineAlpha = (1 - dist / 110) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 65, ${lineAlpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        // Draw and update particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulseFactor += p.pulseSpeed;
            const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulseFactor) * 0.25);

            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = currentAlpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        });

        requestAnimationFrame(render);
    }

    render();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBen10BackgroundCanvas);
} else {
    initBen10BackgroundCanvas();
}



