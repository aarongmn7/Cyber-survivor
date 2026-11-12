// ============================================================
// Neon Protocol: Cyber Survivor
// Pure HTML5 Canvas / Vanilla JS Roguelike Survival
// ============================================================

(function () {
  'use strict';

  // Canvas & Context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const V_WIDTH = 1280;
  const V_HEIGHT = 720;

  // Aaron Nascimento Monogram Spaceship (Pontinha frontal, Asas Stealth, Logo AN central & Rabinho com propulsor)
  const LOGO_SVG_DATA = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <clipPath id="innerShipCircle">
        <circle cx="50" cy="50" r="23" />
      </clipPath>
    </defs>
    <!-- Asas Stealth Delta e Fuselagem -->
    <polygon points="50,5 64,24 82,68 86,88 74,84 66,74 58,78 50,78 42,78 34,74 26,84 14,88 18,68 36,24" 
             fill="#09090b" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
    <!-- Aletas Estabilizadoras Traseiras (Rabinho) -->
    <polygon points="26,84 20,95 32,91 35,78" fill="#18181b" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
    <polygon points="74,84 80,95 68,91 65,78" fill="#18181b" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
    <!-- Bocal do Propulsor e Chama Neon -->
    <polygon points="43,78 57,78 55,87 45,87" fill="#27272a" stroke="#ffffff" stroke-width="1.8" />
    <polygon points="46,87 54,87 50,97" fill="#00f0ff" opacity="0.95" />
    <polygon points="47.5,87 52.5,87 50,93" fill="#ffffff" />
    <!-- Ranhuras de Painéis -->
    <line x1="38" y1="36" x2="26" y2="68" stroke="#ffffff" stroke-width="1.2" opacity="0.5" />
    <line x1="62" y1="36" x2="74" y2="68" stroke="#ffffff" stroke-width="1.2" opacity="0.5" />
    <!-- Canhões Laser de Asa -->
    <line x1="18" y1="64" x2="18" y2="54" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <line x1="82" y1="64" x2="82" y2="54" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    <!-- Pontinha da Nave (Bico / Cockpit Stealth) -->
    <polygon points="50,4 56,18 50,22 44,18" fill="#ffffff" />
    <line x1="50" y1="4" x2="50" y2="23" stroke="#09090b" stroke-width="1.5" />
    <polygon points="50,14 53,20 50,22 47,20" fill="#00f0ff" />
    <!-- Núcleo Logo AN -->
    <circle cx="50" cy="50" r="27" stroke="#ffffff" stroke-width="3.8" fill="#09090b" />
    <g clip-path="url(#innerShipCircle)">
      <g transform="translate(50, 50) scale(0.60) translate(-50, -50) translate(16.25, 0) skewX(-18)">
        <line x1="50" y1="-20" x2="50" y2="120" stroke="#ffffff" stroke-width="2" opacity="0.4" />
        <polygon points="30,-20 46,-20 46,120 30,120" fill="#ffffff" />
        <polygon points="-50,-20 30,-20 -2,120 -50,120" fill="#ffffff" />
        <polygon points="0,55 30,55 30,73 0,73" fill="#ffffff" />
        <polygon points="54,-20 70,-20 70,120 54,120" fill="#ffffff" />
        <polygon points="94,-20 150,-20 150,120 94,120" fill="#ffffff" />
        <polygon points="54,-20 70,-20 110,120 94,120" fill="#ffffff" />
      </g>
    </g>
  </svg>`);

  const playerLogoImg = new Image();
  playerLogoImg.src = LOGO_SVG_DATA;

  // Audio System (Procedural Web Audio Synthesizer)
  let audioCtx = null;
  let isMuted = localStorage.getItem('an_survivor_muted') === 'true';

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('an_survivor_muted', isMuted ? 'true' : 'false');
    return isMuted;
  }

  function playSynthSound(type) {
    if (!audioCtx || isMuted) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'explode') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'levelup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'xp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'dash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.16);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'overdrive') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.35);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'pause') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(440, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'elite') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'enemy_shot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'shield_block') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  // Input Tracking
  const keys = {};

  // Teclas do jogo para suprimir atalhos nativos do navegador (scroll, busca, etc.)
  const GAME_KEYS = new Set([
    'w', 'a', 's', 'd', ' ', 'space', 'r', '1', '2', '3',
    'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    'keyw', 'keya', 'keys', 'keyd', 'f', 'p', 'm', 'q', 'shift', 'escape'
  ]);

  window.addEventListener('keydown', (e) => {
    initAudio();
    const keyLower = e.key.toLowerCase();
    const codeLower = e.code.toLowerCase();

    // Bloqueia qualquer tentativa acidental de abrir busca do navegador (Ctrl+F, F3, etc.)
    if ((e.ctrlKey || e.metaKey) && (keyLower === 'f' || keyLower === 'g')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Suprime rolagem da página e atalhos em teclas de controle
    if (GAME_KEYS.has(keyLower) || GAME_KEYS.has(codeLower) || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
    }

    // Mute / Unmute
    if (keyLower === 'm' || codeLower === 'keym') {
      toggleMute();
      return;
    }

    // Pausa técnica
    if (keyLower === 'escape' || keyLower === 'p' || codeLower === 'keyp') {
      togglePause();
      return;
    }

    // Dash / Esquiva no Espaço
    if (e.code === 'Space' || keyLower === ' ') {
      if (state === GameState.PLAYING) {
        triggerDash();
      }
    }

    // Overdrive / Especial no Shift ou Q
    if (keyLower === 'shift' || keyLower === 'q' || codeLower === 'keyq' || codeLower === 'shiftleft' || codeLower === 'shiftright') {
      if (state === GameState.PLAYING) {
        triggerOverdrive();
      }
    }

    keys[keyLower] = true;
    keys[codeLower] = true;
    keys[e.code] = true;

    if (keyLower === 'w' || keyLower === 'a' || keyLower === 's' || keyLower === 'd' ||
        codeLower === 'keyw' || codeLower === 'keya' || codeLower === 'keys' || codeLower === 'keyd' ||
        keyLower.startsWith('arrow')) {
      cursorActive = false;
    }

    if (state === GameState.LEVEL_UP) {
      if (keyLower === '1' || codeLower === 'digit1') selectUpgrade(0);
      if (keyLower === '2' || codeLower === 'digit2') selectUpgrade(1);
      if (keyLower === '3' || codeLower === 'digit3') selectUpgrade(2);
    } else if (state === GameState.GAME_OVER) {
      if (keyLower === 'r' || codeLower === 'keyr' || e.code === 'Space' || keyLower === 'enter') {
        resetGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const keyLower = e.key.toLowerCase();
    const codeLower = e.code.toLowerCase();
    keys[keyLower] = false;
    keys[codeLower] = false;
    keys[e.code] = false;
  });

  // Se o jogador der Alt+Tab ou a janela perder o foco, solta as teclas para não andar sozinho
  window.addEventListener('blur', () => {
    for (const k in keys) {
      keys[k] = false;
    }
  });

  // Pointer & Touch Controls (Suporte Mobile, Mouse Drag e Mira Direcional por Cursor)
  let isPointerDown = false;
  let pointerTarget = null;
  let cursorPos = null;
  let cursorActive = false;

  function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('mousedown', (e) => {
    initAudio();
    const m = getCanvasMousePos(e);
    // Não ativa arrasto se clicar no HUD
    if (m.y > 55 && state === GameState.PLAYING) {
      isPointerDown = true;
      pointerTarget = m;
      cursorPos = m;
      cursorActive = true;
    }
  });

  window.addEventListener('mousemove', (e) => {
    const m = getCanvasMousePos(e);
    if (m.y > 55 && state === GameState.PLAYING) {
      cursorPos = m;
      cursorActive = true;
      if (isPointerDown) {
        pointerTarget = m;
      }
    }
  });

  window.addEventListener('mouseup', () => {
    isPointerDown = false;
    pointerTarget = null;
  });

  // Touch Support (Celular / Tablet)
  canvas.addEventListener('touchstart', (e) => {
    initAudio();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const m = {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
      };
      if (m.y > 55 && state === GameState.PLAYING) {
        isPointerDown = true;
        pointerTarget = m;
        cursorPos = m;
        cursorActive = true;
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const m = {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
      };
      if (m.y > 55 && state === GameState.PLAYING) {
        cursorPos = m;
        cursorActive = true;
        if (isPointerDown) {
          pointerTarget = m;
        }
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isPointerDown = false;
    pointerTarget = null;
  });

  canvas.addEventListener('click', (e) => {
    initAudio();
    const m = getCanvasMousePos(e);

    // Botões do HUD (Mute e Pause)
    if (m.y >= 10 && m.y <= 40) {
      // Mute button
      if (m.x >= V_WIDTH - 95 && m.x <= V_WIDTH - 20) {
        toggleMute();
        return;
      }
      // Pause button
      if (m.x >= V_WIDTH - 180 && m.x <= V_WIDTH - 105) {
        togglePause();
        return;
      }
    }

    if (state === GameState.PAUSED) {
      state = GameState.PLAYING;
      return;
    }

    if (state === GameState.LEVEL_UP) {
      const cardW = UPGRADE_CARD_W;
      const cardH = UPGRADE_CARD_H;
      const cardGap = UPGRADE_CARD_GAP;
      const startX = (V_WIDTH - (3 * cardW + 2 * cardGap)) * 0.5;
      const cardY = (V_HEIGHT - cardH) * 0.5 + 20;

      for (let i = 0; i < upgradeOptions.length; i++) {
        const rx = startX + i * (cardW + cardGap);
        if (m.x >= rx && m.x <= rx + cardW && m.y >= cardY && m.y <= cardY + cardH) {
          selectUpgrade(i);
          break;
        }
      }
    } else if (state === GameState.GAME_OVER) {
      const cx = V_WIDTH * 0.5;
      const cy = V_HEIGHT * 0.5;

      // Botão Restart
      const btnX = cx - 140;
      const btnY = cy + 90;
      const btnW = 280;
      const btnH = 42;
      if (m.x >= btnX && m.x <= btnX + btnW && m.y >= btnY && m.y <= btnY + btnH) {
        resetGame();
        return;
      }

      // Botão GitHub
      const ghX = cx - 145;
      const ghY = cy + 145;
      const ghW = 140;
      const ghH = 36;
      if (m.x >= ghX && m.x <= ghX + ghW && m.y >= ghY && m.y <= ghY + ghH) {
        window.open('https://github.com/aarongmn7', '_blank');
        return;
      }

      // Botão Portfolio
      const portX = cx + 5;
      const portY = cy + 145;
      const portW = 140;
      const portH = 36;
      if (m.x >= portX && m.x <= portX + portW && m.y >= portY && m.y <= portY + portH) {
        window.open('https://aaron.dev.br/', '_blank');
        return;
      }
    }
  });

  // Game States
  const GameState = {
    PLAYING: 0,
    LEVEL_UP: 1,
    GAME_OVER: 2,
    PAUSED: 3
  };
  let state = GameState.PLAYING;

  function togglePause() {
    if (state === GameState.PLAYING) {
      state = GameState.PAUSED;
      playSynthSound('pause');
    } else if (state === GameState.PAUSED) {
      state = GameState.PLAYING;
      playSynthSound('pause');
    }
  }

  // Game Parameters & Constants (matching mechanics.json)
  const BASE_PLAYER_SPEED = 380.0;
  const BASE_PLAYER_MAX_HEALTH = 100.0;
  const BASE_LASER_COOLDOWN = 0.40;
  const BASE_LASER_DAMAGE = 25.0;
  const BASE_LASER_SPEED = 650.0;
  const TRIPLE_SHOT_SPREAD = 0.26;
  const ORBITAL_SHIELD_SPEED = 2.8;
  const ORBITAL_SHIELD_DAMAGE = 45.0;
  const BASE_XP_MAGNET_RADIUS = 150.0;
  const BASE_XP_LEVEL_UP = 50.0;
  const BASE_SPAWN_INTERVAL = 1.10;

  // Player State
  let player = {
    x: V_WIDTH * 0.5,
    y: V_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    speed: BASE_PLAYER_SPEED,
    health: BASE_PLAYER_MAX_HEALTH,
    maxHealth: BASE_PLAYER_MAX_HEALTH,
    invulnerableTimer: 0.0
  };

  // Progression & Stats
  let score = 0;
  let enemiesKilled = 0;
  let level = 1;
  let currentXP = 0;
  let targetXP = BASE_XP_LEVEL_UP;
  let survivalTimer = 0;

  // Weapons & Upgrades (Uncapped & Scalable)
  let fireRateMultiplier = 1.0;
  let laserCooldownTimer = 0.0;
  let projectileCount = 1;       // Multishot escalável: 1 -> 3 -> 5 -> 7 -> 9+
  let laserPierce = 1;           // Penetração de feixes a laser
  let critChance = 0.05;         // 5% base crit chance
  let critMultiplier = 2.2;      // Multiplicador crítico
  let hasOrbitalShield = false;
  let orbitalShieldCount = 0;    // Sem limite: anéis concêntricos + bloqueio de tiros
  let orbitalShieldAngle = 0.0;
  let droneCount = 0;            // Drones orbitais autônomos com tiro independente
  let drones = [];
  let xpMagnetRadius = BASE_XP_MAGNET_RADIUS;
  let hasEmpNova = false;
  let empTimer = 0.0;
  const empCooldown = 3.5;

  // Dynamic Camera Zoom
  let currentZoom = 1.0;
  let targetZoom = 1.0;

  // Dash & Mobility (Tactical Thrusters)
  const DASH_COOLDOWN = 1.35;
  const DASH_DURATION = 0.18;
  const DASH_SPEED_MULT = 2.8;
  let dashCooldownTimer = 0.0;
  let dashActiveTimer = 0.0;
  let dashDirX = 0;
  let dashDirY = 0;
  let ghostTrails = [];

  // Overdrive Protocol (Special 360 Burst)
  let overdriveCharge = 0.0; // 0 a 100%
  let isOverdriveActive = false;
  let overdriveTimer = 0.0;
  const OVERDRIVE_DURATION = 2.4;

  // Elite Waves & Radar Sensor
  let eliteWarningTimer = 0.0;
  let nextEliteTime = 50.0;
  let radarScanAngle = 0.0;

  // Upgrade Choices
  const UPGRADE_CARD_W = 264;
  const UPGRADE_CARD_H = 250;
  const UPGRADE_CARD_GAP = 24;
  let upgradeOptions = [];

  // Entities
  let lasers = [];
  let enemies = [];
  let enemyBullets = [];
  let xpGems = [];
  let particles = [];
  let floatingTexts = [];
  let empWaves = [];

  // Spawner & Grid
  let spawnTimer = 0.0;
  let currentSpawnInterval = BASE_SPAWN_INTERVAL;
  let gridOffsetX = 0;
  let gridOffsetY = 0;
  let screenShake = 0.0;

  function resetGame() {
    player.x = V_WIDTH * 0.5;
    player.y = V_HEIGHT * 0.5;
    player.vx = 0;
    player.vy = 0;
    player.angle = -Math.PI / 2;
    player.speed = BASE_PLAYER_SPEED;
    player.maxHealth = BASE_PLAYER_MAX_HEALTH;
    player.health = player.maxHealth;
    player.invulnerableTimer = 0.0;

    score = 0;
    enemiesKilled = 0;
    level = 1;
    currentXP = 0;
    targetXP = BASE_XP_LEVEL_UP;
    survivalTimer = 0;

    dashCooldownTimer = 0.0;
    dashActiveTimer = 0.0;
    ghostTrails.length = 0;
    overdriveCharge = 0.0;
    isOverdriveActive = false;
    overdriveTimer = 0.0;
    eliteWarningTimer = 0.0;
    nextEliteTime = 50.0;

    fireRateMultiplier = 1.0;
    laserCooldownTimer = 0.0;
    projectileCount = 1;
    laserPierce = 1;
    critChance = 0.05;
    critMultiplier = 2.2;
    hasOrbitalShield = false;
    orbitalShieldCount = 0;
    orbitalShieldAngle = 0.0;
    droneCount = 0;
    drones.length = 0;
    xpMagnetRadius = BASE_XP_MAGNET_RADIUS;
    hasEmpNova = false;
    empTimer = 0.0;

    currentZoom = 1.0;
    targetZoom = 1.0;

    lasers.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
    xpGems.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    empWaves.length = 0;

    isPointerDown = false;
    pointerTarget = null;
    cursorPos = null;
    cursorActive = false;

    spawnTimer = 0.0;
    currentSpawnInterval = BASE_SPAWN_INTERVAL;
    screenShake = 0.0;
    state = GameState.PLAYING;
  }

  // Game Loop
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  function triggerDash() {
    if (dashCooldownTimer > 0 || state !== GameState.PLAYING) return;
    dashCooldownTimer = DASH_COOLDOWN;
    dashActiveTimer = DASH_DURATION;

    const len = Math.hypot(player.vx, player.vy);
    if (len > 10) {
      dashDirX = player.vx / len;
      dashDirY = player.vy / len;
    } else {
      dashDirX = Math.cos(player.angle);
      dashDirY = Math.sin(player.angle);
    }

    player.invulnerableTimer = Math.max(player.invulnerableTimer, DASH_DURATION + 0.12);
    playSynthSound('dash');
    createSparks(player.x, player.y, '#ffffff', 14);

    ghostTrails.push({
      x: player.x,
      y: player.y,
      angle: player.angle,
      life: 0.32,
      maxLife: 0.32
    });
  }

  function triggerOverdrive() {
    if (overdriveCharge < 100 || isOverdriveActive || state !== GameState.PLAYING) return;
    isOverdriveActive = true;
    overdriveTimer = OVERDRIVE_DURATION;
    overdriveCharge = 0.0;

    playSynthSound('overdrive');
    screenShake = 18;
    addFloatingText(player.x, player.y - 45, 'OVERDRIVE ENGAGED!', '#ffffff');

    // Pulso espiral 360° com 16 feixes supervelozes perfurantes
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (i * Math.PI * 2) / rays;
      lasers.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(a) * BASE_LASER_SPEED * 1.5,
        vy: Math.sin(a) * BASE_LASER_SPEED * 1.5,
        damage: BASE_LASER_DAMAGE * 3.0,
        life: 1.4,
        pierce: 4,
        isCrit: true,
        hitEnemies: new Set()
      });
    }

    empWaves.push({
      x: player.x,
      y: player.y,
      radius: 20,
      maxRadius: 360,
      speed: 550,
      damage: 80
    });
  }

  function updateGhostTrails(dt) {
    for (let i = ghostTrails.length - 1; i >= 0; i--) {
      const g = ghostTrails[i];
      g.life -= dt;
      if (g.life <= 0) {
        ghostTrails.splice(i, 1);
      }
    }
  }

  function spawnEliteEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let spawnX = 0, spawnY = 0;
    const offset = 60;
    switch (edge) {
      case 0: spawnX = Math.random() * V_WIDTH; spawnY = -offset; break;
      case 1: spawnX = V_WIDTH + offset; spawnY = Math.random() * V_HEIGHT; break;
      case 2: spawnX = Math.random() * V_WIDTH; spawnY = V_HEIGHT + offset; break;
      case 3: spawnX = -offset; spawnY = Math.random() * V_HEIGHT; break;
    }

    enemies.push({
      x: spawnX,
      y: spawnY,
      hp: 380 + (survivalTimer * 6),
      maxHp: 380 + (survivalTimer * 6),
      speed: 60,
      radius: 36,
      color: '#ffffff',
      type: 'elite_trojan',
      isElite: true
    });
  }

  function update(dt) {
    if (state === GameState.PLAYING) {
      survivalTimer += dt;

      // Dynamic Camera Zoom Calculation based on player speed and dashing
      const speedRatio = player.speed / BASE_PLAYER_SPEED;
      const dashBonus = dashActiveTimer > 0 ? 0.08 : 0.0;
      targetZoom = Math.max(0.68, 1.0 - (speedRatio - 1.0) * 0.22 - dashBonus);
      currentZoom += (targetZoom - currentZoom) * Math.min(1.0, 5.0 * dt);

      // Dash timers
      if (dashCooldownTimer > 0) {
        dashCooldownTimer = Math.max(0, dashCooldownTimer - dt);
      }
      if (dashActiveTimer > 0) {
        dashActiveTimer = Math.max(0, dashActiveTimer - dt);
      }

      // Overdrive timers
      if (isOverdriveActive) {
        overdriveTimer = Math.max(0, overdriveTimer - dt);
        if (overdriveTimer <= 0) {
          isOverdriveActive = false;
        }
      }

      // Elite Threat Anomaly Warning & Trigger (a cada 60s)
      if (survivalTimer >= nextEliteTime) {
        nextEliteTime += 60.0;
        eliteWarningTimer = 3.5;
        playSynthSound('elite');
        spawnEliteEnemy();
      }
      if (eliteWarningTimer > 0) {
        eliteWarningTimer = Math.max(0, eliteWarningTimer - dt);
      }

      if (player.invulnerableTimer > 0) {
        player.invulnerableTimer -= dt;
      }
      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - dt * 25);
      }

      // Movement Input (WASD or Touch/Mouse Drag)
      handlePlayerMovement(dt);

      // Weapons (Overdrive boosts fire rate)
      handleAutoCombat(dt);

      // Orbital Shield
      if (hasOrbitalShield && orbitalShieldCount > 0) {
        orbitalShieldAngle = (orbitalShieldAngle + ORBITAL_SHIELD_SPEED * dt) % (Math.PI * 2);
        handleOrbitalShield(dt);
      }

      // Satellite Bit Drones
      if (droneCount > 0) {
        updateDrones(dt);
      }

      // EMP Nova
      if (hasEmpNova) {
        empTimer += dt;
        if (empTimer >= empCooldown) {
          empTimer = 0;
          triggerEmpNova();
        }
      }
      updateEmpWaves(dt);

      // Enemy Spawner
      spawnTimer += dt;
      currentSpawnInterval = Math.max(0.35, BASE_SPAWN_INTERVAL - (survivalTimer / 75.0) * 0.4);
      if (spawnTimer >= currentSpawnInterval) {
        spawnTimer = 0;
        spawnEnemyWave();
      }

      // Updates
      updateLasers(dt);
      updateEnemyBullets(dt);
      updateEnemies(dt);
      updateXpGems(dt);
      updateGhostTrails(dt);
    }

    updateParticles(dt);
    updateFloatingTexts(dt);
  }

  function handlePlayerMovement(dt) {
    if (dashActiveTimer > 0) {
      player.vx = dashDirX * player.speed * DASH_SPEED_MULT;
      player.vy = dashDirY * player.speed * DASH_SPEED_MULT;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      if (Math.random() < 0.8) {
        ghostTrails.push({
          x: player.x,
          y: player.y,
          angle: player.angle,
          life: 0.28,
          maxLife: 0.28
        });
      }

      const margin = 28;
      player.x = Math.max(margin, Math.min(V_WIDTH - margin, player.x));
      player.y = Math.max(margin + 45, Math.min(V_HEIGHT - margin, player.y));
      gridOffsetX += player.vx * dt * 0.35;
      gridOffsetY += player.vy * dt * 0.35;
      return;
    }

    let dx = 0;
    let dy = 0;

    // 1. Suporte a Arraste de Mouse / Touch
    if (isPointerDown && pointerTarget) {
      const pdx = pointerTarget.x - player.x;
      const pdy = pointerTarget.y - player.y;
      const pdist = Math.hypot(pdx, pdy);
      if (pdist > 4) {
        player.angle = Math.atan2(pdy, pdx);
      }
      if (pdist > 25) {
        dx = pdx / pdist;
        dy = pdy / pdist;
      }
    } else {
      // 2. Teclado WASD / Setas
      if (keys['w'] || keys['keyw'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['keys'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['keya'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['keyd'] || keys['arrowright']) dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      const targetVx = dx * player.speed;
      const targetVy = dy * player.speed;
      const accelFactor = Math.min(1.0, 18.0 * dt);
      player.vx += (targetVx - player.vx) * accelFactor;
      player.vy += (targetVy - player.vy) * accelFactor;

      if (!(isPointerDown && pointerTarget) && !cursorActive) {
        player.angle = Math.atan2(dy, dx);
      }

      // Thruster exhaust particles (Monochrome Zinc & White)
      if (Math.random() < 0.6) {
        const tx = player.x - dx * 20;
        const ty = player.y - dy * 20;
        const pColors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'];
        particles.push({
          x: tx + (Math.random() - 0.5) * 8,
          y: ty + (Math.random() - 0.5) * 8,
          vx: -dx * (60 + Math.random() * 60) + (Math.random() - 0.5) * 20,
          vy: -dy * (60 + Math.random() * 60) + (Math.random() - 0.5) * 20,
          color: pColors[Math.floor(Math.random() * pColors.length)],
          size: 2.5 + Math.random() * 3,
          life: 0.35,
          maxLife: 0.35
        });
      }
    } else {
      const brakeFactor = Math.min(1.0, 22.0 * dt);
      player.vx += (0 - player.vx) * brakeFactor;
      player.vy += (0 - player.vy) * brakeFactor;
      if (Math.abs(player.vx) < 5) player.vx = 0;
      if (Math.abs(player.vy) < 5) player.vy = 0;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Arena Clamping
    const margin = 28;
    player.x = Math.max(margin, Math.min(V_WIDTH - margin, player.x));
    player.y = Math.max(margin + 45, Math.min(V_HEIGHT - margin, player.y));

    // Orient ship nose toward active cursor/finger so shots disperse across space following cursor/finger
    if (cursorActive && cursorPos && !(isPointerDown && pointerTarget)) {
      const cdx = cursorPos.x - player.x;
      const cdy = cursorPos.y - player.y;
      if (Math.hypot(cdx, cdy) > 5) {
        player.angle = Math.atan2(cdy, cdx);
      }
    }

    gridOffsetX += player.vx * dt * 0.35;
    gridOffsetY += player.vy * dt * 0.35;
  }

  function handleAutoCombat(dt) {
    laserCooldownTimer -= dt;
    const speedBoost = isOverdriveActive ? 0.45 : 1.0;
    const currentCooldown = BASE_LASER_COOLDOWN * fireRateMultiplier * speedBoost;

    if (laserCooldownTimer <= 0) {
      fireLasers();
      laserCooldownTimer = currentCooldown;
      playSynthSound('laser');
    }
  }

  function fireLasers() {
    const baseAngle = player.angle;
    const spreadStep = 0.12;
    const startAngle = baseAngle - ((projectileCount - 1) * 0.5) * spreadStep;

    for (let i = 0; i < projectileCount; i++) {
      const ang = startAngle + i * spreadStep;
      const isCrit = Math.random() < critChance;
      const dmg = (BASE_LASER_DAMAGE + (level - 1) * 1.5) * (isCrit ? critMultiplier : 1.0);

      lasers.push({
        x: player.x + Math.cos(ang) * 20,
        y: player.y + Math.sin(ang) * 20,
        vx: Math.cos(ang) * BASE_LASER_SPEED,
        vy: Math.sin(ang) * BASE_LASER_SPEED,
        damage: dmg,
        life: 1.4,
        pierce: laserPierce,
        isCrit: isCrit,
        hitEnemies: new Set()
      });
    }
  }

  function getOrbitalShieldPositions() {
    const positions = [];
    if (orbitalShieldCount <= 0) return positions;

    if (orbitalShieldCount <= 4) {
      const radius = 70;
      for (let i = 0; i < orbitalShieldCount; i++) {
        const ang = orbitalShieldAngle + (i * (Math.PI * 2 / orbitalShieldCount));
        positions.push({
          x: player.x + Math.cos(ang) * radius,
          y: player.y + Math.sin(ang) * radius,
          ang: ang,
          radius: radius
        });
      }
    } else if (orbitalShieldCount <= 10) {
      // Anel 1: 4 orbs a 60px
      const r1 = 60;
      for (let i = 0; i < 4; i++) {
        const ang = orbitalShieldAngle + (i * (Math.PI * 2 / 4));
        positions.push({
          x: player.x + Math.cos(ang) * r1,
          y: player.y + Math.sin(ang) * r1,
          ang: ang,
          radius: r1
        });
      }
      // Anel 2: restantes a 95px girando no sentido oposto
      const count2 = orbitalShieldCount - 4;
      const r2 = 95;
      for (let i = 0; i < count2; i++) {
        const ang = -orbitalShieldAngle * 1.2 + (i * (Math.PI * 2 / count2));
        positions.push({
          x: player.x + Math.cos(ang) * r2,
          y: player.y + Math.sin(ang) * r2,
          ang: ang,
          radius: r2
        });
      }
    } else {
      // Anel 1: 4 orbs a 55px
      const r1 = 55;
      for (let i = 0; i < 4; i++) {
        const ang = orbitalShieldAngle + (i * (Math.PI * 2 / 4));
        positions.push({
          x: player.x + Math.cos(ang) * r1,
          y: player.y + Math.sin(ang) * r1,
          ang: ang,
          radius: r1
        });
      }
      // Anel 2: 6 orbs a 90px
      const r2 = 90;
      for (let i = 0; i < 6; i++) {
        const ang = -orbitalShieldAngle * 1.15 + (i * (Math.PI * 2 / 6));
        positions.push({
          x: player.x + Math.cos(ang) * r2,
          y: player.y + Math.sin(ang) * r2,
          ang: ang,
          radius: r2
        });
      }
      // Anel 3: restantes a 125px
      const count3 = orbitalShieldCount - 10;
      const r3 = 125;
      for (let i = 0; i < count3; i++) {
        const ang = orbitalShieldAngle * 1.3 + (i * (Math.PI * 2 / count3));
        positions.push({
          x: player.x + Math.cos(ang) * r3,
          y: player.y + Math.sin(ang) * r3,
          ang: ang,
          radius: r3
        });
      }
    }

    return positions;
  }

  function handleOrbitalShield(dt) {
    const orbHitRadius = 14;
    const positions = getOrbitalShieldPositions();

    for (let p = 0; p < positions.length; p++) {
      const pos = positions[p];

      // 1. Dano por contato contínuo em inimigos
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (Math.hypot(pos.x - e.x, pos.y - e.y) <= orbHitRadius + e.radius) {
          e.hp -= ORBITAL_SHIELD_DAMAGE * dt * 2.8;
          createSparks(pos.x, pos.y, '#ffffff', 2);
          if (e.hp <= 0) {
            defeatEnemy(e);
          }
        }
      }

      // 2. Interceptação e destruição tática de projéteis inimigos!
      for (let b = enemyBullets.length - 1; b >= 0; b--) {
        const eb = enemyBullets[b];
        if (Math.hypot(pos.x - eb.x, pos.y - eb.y) <= orbHitRadius + eb.radius + 6) {
          enemyBullets.splice(b, 1);
          createSparks(pos.x, pos.y, '#ffffff', 8);
          playSynthSound('shield_block');
          addFloatingText(pos.x, pos.y - 12, 'DEFLECTED', '#ffffff');
        }
      }
    }
  }

  function updateDrones(dt) {
    if (droneCount <= 0) return;

    while (drones.length < droneCount) {
      drones.push({ shootTimer: Math.random() * 0.5 });
    }

    for (let i = 0; i < drones.length; i++) {
      const dr = drones[i];
      dr.shootTimer -= dt;
      const ang = (survivalTimer * 2.2) + (i * (Math.PI * 2 / droneCount));
      const dx = player.x + Math.cos(ang) * 48;
      const dy = player.y + Math.sin(ang) * 48;

      if (dr.shootTimer <= 0) {
        let nearest = null;
        let minDist = 420;
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          const dist = Math.hypot(dx - e.x, dy - e.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = e;
          }
        }

        if (nearest) {
          const fAng = Math.atan2(nearest.y - dy, nearest.x - dx);
          lasers.push({
            x: dx,
            y: dy,
            vx: Math.cos(fAng) * (BASE_LASER_SPEED * 1.1),
            vy: Math.sin(fAng) * (BASE_LASER_SPEED * 1.1),
            damage: BASE_LASER_DAMAGE * 0.70,
            life: 0.9,
            pierce: 1,
            isCrit: Math.random() < critChance,
            isDroneShot: true,
            hitEnemies: new Set()
          });
          playSynthSound('laser');
          dr.shootTimer = 0.65;
        }
      }
    }
  }

  function drawDrones() {
    if (droneCount <= 0) return;
    ctx.save();
    for (let i = 0; i < droneCount; i++) {
      const ang = (survivalTimer * 2.2) + (i * (Math.PI * 2 / droneCount));
      const dx = player.x + Math.cos(ang) * 48;
      const dy = player.y + Math.sin(ang) * 48;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(ang + Math.PI * 0.5);

      // Micro drone AN
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#09090b';

      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drone core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  function updateEnemyBullets(dt) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Colisão com o jogador
      if (player.invulnerableTimer <= 0 && Math.hypot(b.x - player.x, b.y - player.y) <= b.radius + 16) {
        player.health -= b.damage;
        player.invulnerableTimer = 0.55;
        screenShake = 11;
        createSparks(player.x, player.y, '#ffffff', 10);
        addFloatingText(player.x, player.y - 25, `-${b.damage} HP`, '#ffffff');
        playSynthSound('hit');

        if (player.health <= 0) {
          triggerGameOver();
        }
        enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        enemyBullets.splice(i, 1);
      }
    }
  }

  function drawEnemyBullets() {
    ctx.save();
    for (const b of enemyBullets) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function triggerEmpNova() {
    empWaves.push({
      x: player.x,
      y: player.y,
      radius: 10,
      maxRadius: 240,
      damage: 60
    });
    screenShake = 8;
    playSynthSound('explode');
  }

  function updateEmpWaves(dt) {
    for (let i = empWaves.length - 1; i >= 0; i--) {
      const w = empWaves[i];
      w.radius += dt * 420;

      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const dist = Math.hypot(w.x - e.x, w.y - e.y);
        if (Math.abs(dist - w.radius) < 25) {
          e.hp -= w.damage * dt * 5;
          if (e.hp <= 0) {
            defeatEnemy(e);
          }
        }
      }

      if (w.radius >= w.maxRadius) {
        empWaves.splice(i, 1);
      }
    }
  }

  function spawnEnemyWave() {
    let spawnX = 0;
    let spawnY = 0;
    const edge = Math.floor(Math.random() * 4);
    const offset = 40;

    switch (edge) {
      case 0: spawnX = Math.random() * V_WIDTH; spawnY = -offset; break;
      case 1: spawnX = V_WIDTH + offset; spawnY = Math.random() * V_HEIGHT; break;
      case 2: spawnX = Math.random() * V_WIDTH; spawnY = V_HEIGHT + offset; break;
      case 3: spawnX = -offset; spawnY = Math.random() * V_HEIGHT; break;
    }

    const roll = Math.random();
    let type = 'mite';
    let hp = 20 + (survivalTimer / 30) * 12;
    let speed = 95 + (Math.random() - 0.5) * 30;
    let radius = 14;
    let color = '#d4d4d8'; // Zinc 300

    if (survivalTimer > 12 && roll < 0.28) {
      type = 'sniper';
      hp = 30 + (survivalTimer / 25) * 12;
      speed = 85;
      radius = 16;
      color = '#e4e4e7';
    } else if (survivalTimer > 30 && roll < 0.55) {
      type = 'byte';
      hp = 45 + (survivalTimer / 20) * 15;
      speed = 70;
      radius = 18;
      color = '#ffffff'; // Pure White
    } else if (survivalTimer > 60 && roll < 0.20) {
      type = 'corruptor';
      hp = 160 + (survivalTimer / 15) * 40;
      speed = 45;
      radius = 28;
      color = '#a1a1aa'; // Zinc 400
    }

    enemies.push({
      x: spawnX,
      y: spawnY,
      hp: hp,
      maxHp: hp,
      speed: speed,
      radius: radius,
      color: color,
      type: type,
      shootTimer: 1.6 + Math.random() * 1.2
    });
  }

  function updateLasers(dt) {
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
      l.hitEnemies = l.hitEnemies || new Set();

      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (l.hitEnemies.has(e)) continue;

        if (Math.hypot(l.x - e.x, l.y - e.y) <= e.radius + 6) {
          l.hitEnemies.add(e);
          e.hp -= l.damage;
          l.pierce = (l.pierce !== undefined ? l.pierce : 1) - 1;

          if (l.isCrit) {
            screenShake = Math.max(screenShake, 5);
            createSparks(l.x, l.y, '#ffffff', 8);
            addFloatingText(e.x, e.y - 20, `⚡CRIT! ${Math.floor(l.damage)}`, '#ffffff');
          } else {
            createSparks(l.x, l.y, '#ffffff', 4);
          }
          playSynthSound('hit');

          if (e.hp <= 0) {
            defeatEnemy(e);
          }

          if (l.pierce <= 0) break;
        }
      }

      if ((l.pierce !== undefined && l.pierce <= 0) || l.life <= 0) {
        lasers.splice(i, 1);
      }
    }
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.hp <= 0) {
        enemies.splice(i, 1);
        continue;
      }

      if (e.type === 'sniper') {
        // Inimigo atirador de precisão: mantém distância tática (kiting)
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        const desiredDist = 330;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);

        if (dist > desiredDist + 40) {
          e.x += Math.cos(angle) * e.speed * dt;
          e.y += Math.sin(angle) * e.speed * dt;
        } else if (dist < desiredDist - 40) {
          e.x -= Math.cos(angle) * (e.speed * 0.85) * dt;
          e.y -= Math.sin(angle) * (e.speed * 0.85) * dt;
        } else {
          // Deslocamento lateral evasivo
          e.x += Math.cos(angle + Math.PI * 0.5) * (e.speed * 0.6) * dt;
          e.y += Math.sin(angle + Math.PI * 0.5) * (e.speed * 0.6) * dt;
        }

        e.x = Math.max(20, Math.min(V_WIDTH - 20, e.x));
        e.y = Math.max(60, Math.min(V_HEIGHT - 20, e.y));

        // Disparo de projétil inimigo com recarga
        e.shootTimer = (e.shootTimer || 2.0) - dt;
        if (e.shootTimer <= 0) {
          const aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
          enemyBullets.push({
            x: e.x + Math.cos(aimAngle) * (e.radius + 6),
            y: e.y + Math.sin(aimAngle) * (e.radius + 6),
            vx: Math.cos(aimAngle) * 320,
            vy: Math.sin(aimAngle) * 320,
            radius: 5.5,
            damage: 14,
            life: 3.5
          });
          playSynthSound('enemy_shot');
          e.shootTimer = 2.4 + Math.random() * 0.6;
        }
      } else {
        // Mobs comuns de combate corpo-a-corpo
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;
      }

      // Boss Anomaly Elite dispara rajada de 5 projéteis em leque
      if (e.isElite) {
        e.eliteShootTimer = (e.eliteShootTimer || 3.8) - dt;
        if (e.eliteShootTimer <= 0) {
          const aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
          for (let s = -2; s <= 2; s++) {
            const sang = aimAngle + s * 0.16;
            enemyBullets.push({
              x: e.x + Math.cos(sang) * (e.radius + 8),
              y: e.y + Math.sin(sang) * (e.radius + 8),
              vx: Math.cos(sang) * 260,
              vy: Math.sin(sang) * 260,
              radius: 6,
              damage: 18,
              life: 3.6
            });
          }
          playSynthSound('enemy_shot');
          e.eliteShootTimer = 4.2;
        }
      }

      // Check collision with player
      if (player.invulnerableTimer <= 0 && Math.hypot(e.x - player.x, e.y - player.y) <= e.radius + 16) {
        player.health -= 15;
        player.invulnerableTimer = 0.6;
        screenShake = 12;
        createSparks(player.x, player.y, '#ffffff', 12);
        addFloatingText(player.x, player.y - 25, '-15 HP', '#ffffff');
        playSynthSound('hit');

        if (player.health <= 0) {
          triggerGameOver();
        }
      }
    }
  }

  function defeatEnemy(e) {
    enemiesKilled++;
    score += Math.floor(e.maxHp * 2);

    // Overdrive Charge: 3.5% por mob comum, 25% por Elite
    overdriveCharge = Math.min(100, overdriveCharge + (e.isElite ? 25 : 3.5));

    createExplosion(e.x, e.y, '#ffffff', e.isElite ? 35 : 18);
    playSynthSound('explode');

    let gemVal = 10;
    if (e.type === 'byte') gemVal = 25;
    if (e.type === 'corruptor') {
      gemVal = 80;
      screenShake = 14;
    }
    if (e.isElite) {
      gemVal = 150;
      screenShake = 20;
      addFloatingText(e.x, e.y - 30, 'ELITE PURGED! +150 XP', '#ffffff');
    }

    xpGems.push({
      x: e.x,
      y: e.y,
      val: gemVal,
      rot: Math.random() * Math.PI * 2,
      isVacuumed: false,
      isMega: !!e.isElite
    });
  }

  function updateXpGems(dt) {
    for (let i = xpGems.length - 1; i >= 0; i--) {
      const g = xpGems[i];
      g.rot += dt * 2.5;

      const dist = Math.hypot(player.x - g.x, player.y - g.y);
      if (g.isVacuumed || dist <= xpMagnetRadius) {
        const pullSpeed = g.isVacuumed ? 850 : (450 + (1 - dist / xpMagnetRadius) * 350);
        const ang = Math.atan2(player.y - g.y, player.x - g.x);
        g.x += Math.cos(ang) * pullSpeed * dt;
        g.y += Math.sin(ang) * pullSpeed * dt;
      }

      if (dist <= 26) {
        gainXP(g.val);
        createSparks(g.x, g.y, '#ffffff', 6);
        playSynthSound('xp');
        xpGems.splice(i, 1);
      }
    }
  }

  function gainXP(amt) {
    currentXP += amt;
    score += amt;
    if (currentXP >= targetXP) {
      levelUp();
    }
  }

  function levelUp() {
    currentXP -= targetXP;
    level++;
    targetXP = Math.round(BASE_XP_LEVEL_UP * Math.pow(1.20, level - 1));

    // Bônus passivo a cada nível: +5% Velocidade e +5% Max HP (com cura de 10%)
    player.speed *= 1.05;
    player.maxHealth *= 1.05;
    player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.10);

    addFloatingText(player.x, player.y - 45, 'PROTOCOL LEVEL UP!', '#fafafa');
    addFloatingText(player.x, player.y - 70, '+5% SPEED & HP OVERCLOCK', '#ffffff');
    createExplosion(player.x, player.y, '#ffffff', 32);
    playSynthSound('levelup');

    // Milestone Vacuum: Atração total de XP no mapa (Vampire Survivors mechanic)
    for (const g of xpGems) {
      g.isVacuumed = true;
    }

    openUpgradeModal();
  }

  function openUpgradeModal() {
    state = GameState.LEVEL_UP;
    const catalog = [
      { id: 'multishot', title: 'DISPARO EXPANSIVO', desc: `+2 Lasers em Leque (Total: ${projectileCount + 2})`, icon: '◈' },
      { id: 'orbital_shield', title: 'MATRIZ DE ESCUDOS', desc: `+1 Escudo Orbital Concêntrico (Total: ${orbitalShieldCount + 1})`, icon: '◎' },
      { id: 'laser_pierce', title: 'LASER PERFURANTE', desc: `Lasers atravessam +1 inimigo em linha (Total: ${laserPierce + 1})`, icon: '⇶' },
      { id: 'bit_drone', title: 'DRONE SATELLITE AN', desc: `+1 Drone autônomo com tiro independente (Total: ${droneCount + 1})`, icon: '▲' },
      { id: 'crit_overclock', title: 'OVERCLOCK CRÍTICO', desc: `+20% Chance Crítica (${Math.round((critChance + 0.2) * 100)}% total a 2.2x Dano)`, icon: '⚡' },
      { id: 'fire_rate', title: 'TURBO RECARGA', desc: '+25% Cadência de Disparo em todas as armas', icon: '⏱️' },
      { id: 'emp_nova', title: 'PULSO DEVASTADOR EMP', desc: 'Onda de choque digital periódica a cada 3.5s', icon: '💥' },
      { id: 'magnet', title: 'ÍMÃ GRAVITACIONAL', desc: '+70% Raio de Atração de XP Quântico', icon: '🧲' },
      { id: 'health', title: 'BLINDAGEM NANITE', desc: '+40 HP Máximo e Cura Completa Imediata', icon: '✚' }
    ];

    catalog.sort(() => Math.random() - 0.5);
    upgradeOptions = catalog.slice(0, 3);
  }

  function selectUpgrade(idx) {
    if (idx < 0 || idx >= upgradeOptions.length) return;
    const choice = upgradeOptions[idx];

    switch (choice.id) {
      case 'multishot':
        projectileCount += 2;
        break;
      case 'orbital_shield':
        hasOrbitalShield = true;
        orbitalShieldCount++;
        break;
      case 'laser_pierce':
        laserPierce++;
        break;
      case 'bit_drone':
        droneCount++;
        break;
      case 'crit_overclock':
        critChance = Math.min(0.85, critChance + 0.20);
        critMultiplier += 0.3;
        break;
      case 'fire_rate':
        fireRateMultiplier *= 0.75;
        break;
      case 'emp_nova':
        hasEmpNova = true;
        break;
      case 'magnet':
        xpMagnetRadius *= 1.7;
        break;
      case 'health':
        player.maxHealth += 40;
        player.health = player.maxHealth;
        break;
    }

    state = GameState.PLAYING;
  }

  function triggerGameOver() {
    state = GameState.GAME_OVER;
    const currentRecord = parseInt(localStorage.getItem('an_survivor_record') || '0', 10);
    if (Math.floor(survivalTimer) > currentRecord) {
      localStorage.setItem('an_survivor_record', Math.floor(survivalTimer).toString());
    }
    createExplosion(player.x, player.y, '#ffffff', 45);
    screenShake = 20;
    playSynthSound('explode');
  }

  function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 180;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: color,
        size: 3 + Math.random() * 4,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  function createSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 90;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: color,
        size: 2 + Math.random() * 2,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      life: 1.1,
      maxLife: 1.1
    });
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y -= dt * 30;
      t.life -= dt;
      if (t.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  // ----------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------

  function render() {
    ctx.save();

    // Screen Shake
    if (screenShake > 0) {
      const ox = (Math.random() - 0.5) * screenShake * 2;
      const oy = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(ox, oy);
    }

    // Dynamic Camera Zoom-Out (Escala o mundo conforme a velocidade do jogador)
    ctx.save();
    ctx.translate(V_WIDTH * 0.5, V_HEIGHT * 0.5);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-V_WIDTH * 0.5, -V_HEIGHT * 0.5);

    // 1. OLED Pure Black Background & Extended Technical Grid
    ctx.fillStyle = '#000000';
    ctx.fillRect(-600, -600, V_WIDTH + 1200, V_HEIGHT + 1200);
    drawCyberGrid();

    // Demarcação técnica do perímetro da arena jogável
    drawArenaPerimeter();

    // 2. EMP Waves
    drawEmpWaves();

    // 3. XP Gems
    drawXpGems();

    // 4. Lasers
    drawLasers();

    // 5. Enemy Bullets
    drawEnemyBullets();

    // 6. Enemies
    drawEnemies();

    // 7. Player Ship, Ghost Trails, Drones & Shields
    if (state !== GameState.GAME_OVER) {
      drawGhostTrails();
      drawDrones();
      drawPlayer();
      if (hasOrbitalShield) drawOrbitalShields();
    }

    // 8. Particles
    drawParticles();

    // 9. Floating Combat Texts
    drawFloatingTexts();

    ctx.restore(); // Fecha Dynamic Zoom
    ctx.restore(); // Fecha Screen Shake

    // HUD e Overlays Fixos (Invariantes ao zoom)
    // 10. Tactical Radar Sensor (Canto Inferior Direito)
    if (state !== GameState.GAME_OVER) {
      drawTacticalRadar();
    }

    // 11. Elite Warning Banner
    drawEliteWarning();

    // 12. Top HUD Bar (always stays stationary, no screen shake)
    drawHUD();

    // 13. Modals & Overlays
    if (state === GameState.LEVEL_UP) {
      drawUpgradeModal();
    } else if (state === GameState.GAME_OVER) {
      drawGameOverScreen();
    } else if (state === GameState.PAUSED) {
      drawPauseOverlay();
    }
  }

  function drawArenaPerimeter() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(10, 52, V_WIDTH - 20, V_HEIGHT - 62);
    ctx.setLineDash([]);

    // Cantoneiras técnicas nos quatro vértices
    const corners = [
      [10, 52],
      [V_WIDTH - 10, 52],
      [10, V_HEIGHT - 10],
      [V_WIDTH - 10, V_HEIGHT - 10]
    ];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SECTOR 01 // OPERATIONAL BOUNDARY 1280x720', 22, 68);
    ctx.restore();
  }

  function drawCyberGrid() {
    const cellSize = 60;
    const ox = gridOffsetX % cellSize;
    const oy = gridOffsetY % cellSize;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    for (let x = -600 + ox; x <= V_WIDTH + 600; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, -600);
      ctx.lineTo(x, V_HEIGHT + 600);
      ctx.stroke();
    }

    for (let y = -600 + oy; y <= V_HEIGHT + 600; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(-600, y);
      ctx.lineTo(V_WIDTH + 600, y);
      ctx.stroke();
    }

    // Cruzes técnicas de radar nos nós principais (blueprint minimalista)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = -600 + ox; x <= V_WIDTH + 600; x += cellSize * 2) {
      for (let y = -600 + oy; y <= V_HEIGHT + 600; y += cellSize * 2) {
        ctx.fillRect(x - 2, y, 5, 1);
        ctx.fillRect(x, y - 2, 1, 5);
      }
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI * 0.5);

    const isHit = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 12) % 2 === 0;

    // Rastro e renderização da Nave
    if (isHit) {
      ctx.globalAlpha = 0.35;
    } else {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
    }

    const shipSize = 46;
    if (playerLogoImg.complete && playerLogoImg.naturalWidth !== 0) {
      ctx.drawImage(playerLogoImg, -shipSize * 0.5, -shipSize * 0.5, shipSize, shipSize);
    } else {
      // Vetor fallback idêntico
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, shipSize * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawOrbitalShields() {
    const positions = getOrbitalShieldPositions();
    ctx.save();

    // Desenha anéis guia concêntricos
    const drawnRings = new Set();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (const pos of positions) {
      if (!drawnRings.has(pos.radius)) {
        drawnRings.add(pos.radius);
        ctx.beginPath();
        ctx.arc(player.x, player.y, pos.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const pos of positions) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Mini arco orbital na direção da rotação
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, pos.radius, pos.ang - 0.22, pos.ang + 0.22);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLasers() {
    ctx.save();
    for (const l of lasers) {
      const len = Math.hypot(l.vx, l.vy);
      const nx = (l.vx / len) * (l.isCrit ? 18 : 14);
      const ny = (l.vy / len) * (l.isCrit ? 18 : 14);

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = l.isCrit ? 14 : 8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = l.isCrit ? 3.5 : (l.isDroneShot ? 1.8 : 2.5);

      ctx.beginPath();
      ctx.moveTo(l.x - nx, l.y - ny);
      ctx.lineTo(l.x + nx, l.y + ny);
      ctx.stroke();

      if (l.isCrit) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawGhostTrails() {
    ctx.save();
    for (const g of ghostTrails) {
      const alpha = Math.max(0, g.life / g.maxLife) * 0.45;
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle + Math.PI * 0.5);
      const shipSize = 46;
      if (playerLogoImg.complete && playerLogoImg.naturalWidth !== 0) {
        ctx.drawImage(playerLogoImg, -shipSize * 0.5, -shipSize * 0.5, shipSize, shipSize);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEnemies() {
    ctx.save();
    for (const e of enemies) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = e.isElite ? 16 : 6;
      ctx.strokeStyle = e.color || '#fafafa';
      ctx.lineWidth = e.isElite ? 3 : 2;

      if (e.type === 'mite') {
        // Triangle Glitch Mite
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.radius);
        ctx.lineTo(e.x + e.radius * 0.9, e.y + e.radius * 0.8);
        ctx.lineTo(e.x - e.radius * 0.9, e.y + e.radius * 0.8);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'byte') {
        // Diamond Data Byte
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.radius);
        ctx.lineTo(e.x + e.radius, e.y);
        ctx.lineTo(e.x, e.y + e.radius);
        ctx.lineTo(e.x - e.radius, e.y);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#18181b';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(e.x - e.radius * 0.5, e.y);
        ctx.lineTo(e.x + e.radius * 0.5, e.y);
        ctx.stroke();
      } else if (e.type === 'sniper') {
        // Glitch Sniper / Turret (Sleek directional cannon with telegraphing laser sight)
        const aimAngle = Math.atan2(player.y - e.y, player.x - e.x);

        // Telegraph line when preparing to fire (less than 0.75s to shot)
        if (e.shootTimer !== undefined && e.shootTimer <= 0.75) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(player.x, player.y);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(aimAngle);

        ctx.strokeStyle = '#fafafa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(-e.radius * 0.7, -e.radius * 0.8);
        ctx.lineTo(-e.radius * 0.4, 0);
        ctx.lineTo(-e.radius * 0.7, e.radius * 0.8);
        ctx.closePath();
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.stroke();

        // Directional Barrel
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(e.radius + 8, 0);
        ctx.stroke();

        // Eye core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (e.type === 'corruptor') {
        // Octagon Trojan Corruptor
        const segs = 8;
        ctx.beginPath();
        for (let s = 0; s <= segs; s++) {
          const a = (s * Math.PI * 2) / segs;
          const r = s % 2 === 0 ? e.radius : e.radius * 0.75;
          const px = e.x + Math.cos(a) * r;
          const py = e.y + Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#52525b';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'elite_trojan') {
        // Boss Anomaly Elite
        const segs = 10;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1.15 + Math.sin(survivalTimer * 8) * 0.08), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let s = 0; s <= segs; s++) {
          const a = (s * Math.PI * 2) / segs + survivalTimer * 1.5;
          const r = s % 2 === 0 ? e.radius : e.radius * 0.75;
          const px = e.x + Math.cos(a) * r;
          const py = e.y + Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawXpGems() {
    ctx.save();
    for (const g of xpGems) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);

      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -1.5, 3, 3);

      ctx.restore();
    }
    ctx.restore();
  }

  function drawEmpWaves() {
    ctx.save();
    for (const w of empWaves) {
      const alpha = Math.max(0, (1 - w.radius / w.maxRadius) * 0.8);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloatingTexts() {
    ctx.save();
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    for (const t of floatingTexts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  function drawTacticalRadar() {
    const radarX = V_WIDTH - 75;
    const radarY = V_HEIGHT - 75;
    const radarRadius = 46;
    const detectionRange = 750;

    ctx.save();

    // Fundo do Sonar Glass
    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Anéis concêntricos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Cruz interna
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(radarX - radarRadius, radarY);
    ctx.lineTo(radarX + radarRadius, radarY);
    ctx.moveTo(radarX, radarY - radarRadius);
    ctx.lineTo(radarX, radarY + radarRadius);
    ctx.stroke();

    // Feixe Sonar Giratório
    radarScanAngle = (radarScanAngle + 0.035) % (Math.PI * 2);
    const sweepGrad = ctx.createConicGradient(radarScanAngle, radarX, radarY);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    sweepGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.02)');
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius - 1, 0, Math.PI * 2);
    ctx.fill();

    // Inimigos plotados no radar
    for (const e of enemies) {
      const relX = (e.x - player.x);
      const relY = (e.y - player.y);
      const dist = Math.hypot(relX, relY);
      if (dist <= detectionRange) {
        const plotDist = (dist / detectionRange) * (radarRadius - 4);
        const plotAngle = Math.atan2(relY, relX);
        const px = radarX + Math.cos(plotAngle) * plotDist;
        const py = radarY + Math.sin(plotAngle) * plotDist;

        ctx.fillStyle = e.isElite ? '#ffffff' : (e.type === 'sniper' ? '#e4e4e7' : (e.type === 'corruptor' ? '#a1a1aa' : '#71717a'));
        ctx.beginPath();
        ctx.arc(px, py, e.isElite ? 3 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player (ponto branco central)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(radarX, radarY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#71717a';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR 360°', radarX, radarY + radarRadius + 14);

    ctx.restore();
  }

  function drawEliteWarning() {
    if (eliteWarningTimer <= 0) return;
    const isFlash = Math.floor(eliteWarningTimer * 6) % 2 === 0;
    ctx.save();
    ctx.fillStyle = isFlash ? 'rgba(255, 255, 255, 0.92)' : 'rgba(9, 9, 11, 0.92)';
    ctx.fillRect(V_WIDTH * 0.5 - 220, 58, 440, 28);
    ctx.strokeStyle = '#fafafa';
    ctx.lineWidth = 1;
    ctx.strokeRect(V_WIDTH * 0.5 - 220, 58, 440, 28);

    ctx.fillStyle = isFlash ? '#000000' : '#ffffff';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ WARNING: HIGH THREAT ANOMALY DETECTED', V_WIDTH * 0.5, 76);
    ctx.restore();
  }

  function drawPauseOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    const cx = V_WIDTH * 0.5;
    const cy = V_HEIGHT * 0.5;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
    ctx.fillRect(cx - 240, cy - 90, 480, 180);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 240, cy - 90, 480, 180);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('// SIMULATION PAUSED', cx, cy - 30);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText('PRESS [ESC] OR [P] TO RESUME PROTOCOL', cx, cy + 10);
    ctx.fillText('CLICK ANYWHERE ON SCREEN TO CONTINUE', cx, cy + 35);

    ctx.restore();
  }

  function drawHUD() {
    const barH = 50;
    // Top HUD Bar Glass Background (Dark Zinc)
    ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
    ctx.fillRect(0, 0, V_WIDTH, barH);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(V_WIDTH, barH);
    ctx.stroke();

    // 0. Logo AN + Nome do Jogo (Canto Superior Esquerdo)
    const logoMiniSize = 26;
    if (playerLogoImg.complete && playerLogoImg.naturalWidth !== 0) {
      ctx.drawImage(playerLogoImg, 18, (barH - logoMiniSize) * 0.5, logoMiniSize, logoMiniSize);
    }
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('AN // PROTOCOL SURVIVOR', 52, 31);

    // Divisor técnico 1
    ctx.strokeStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(255, 14);
    ctx.lineTo(255, 36);
    ctx.stroke();

    // 1. Health Bar
    const hpPct = Math.max(0, Math.min(1, player.health / player.maxHealth));
    const hpX = 270;
    const hpY = 16;
    const hpW = 140;
    const hpH = 18;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(hpX, hpY, hpW, hpH);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(hpX, hpY, hpW * hpPct, hpH);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX, hpY, hpW, hpH);

    ctx.fillStyle = '#71717a';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`HP ${Math.max(0, Math.floor(player.health))}/${Math.floor(player.maxHealth)}`, hpX + 6, hpY + 13);

    // 2. Protocol Level Badge
    const lvlX = hpX + hpW + 18;
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(`LVL ${level}`, lvlX, hpY + 13);

    // 3. XP Bar
    const xpPct = Math.max(0, Math.min(1, currentXP / targetXP));
    const xpX = lvlX + 65;
    const xpW = 150;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(xpX, hpY, xpW, hpH);
    ctx.fillStyle = '#a1a1aa';
    ctx.fillRect(xpX, hpY, xpW * xpPct, hpH);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(xpX, hpY, xpW, hpH);

    ctx.fillStyle = '#71717a';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(`XP ${Math.floor(currentXP)}/${Math.floor(targetXP)}`, xpX + 6, hpY + 13);

    // Divisor técnico 2
    ctx.beginPath();
    ctx.moveTo(xpX + xpW + 16, 14);
    ctx.lineTo(xpX + xpW + 16, 36);
    ctx.stroke();

    // 4. Dash Status Indicator
    const dashX = xpX + xpW + 28;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    if (dashCooldownTimer <= 0) {
      ctx.fillStyle = '#fafafa';
      ctx.fillText('DASH [SPACE]', dashX, hpY + 13);
    } else {
      ctx.fillStyle = '#52525b';
      const pct = 1 - (dashCooldownTimer / DASH_COOLDOWN);
      ctx.fillText(`DASH ${(dashCooldownTimer).toFixed(1)}s`, dashX, hpY + 13);
    }

    // 5. Overdrive Meter
    const odX = dashX + 115;
    const odPct = Math.min(1, overdriveCharge / 100);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(odX, hpY + 2, 70, 14);
    ctx.fillStyle = odPct >= 1 ? '#ffffff' : '#a1a1aa';
    ctx.fillRect(odX, hpY + 2, 70 * odPct, 14);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(odX, hpY + 2, 70, 14);

    ctx.fillStyle = odPct >= 1 ? '#000000' : '#71717a';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillText(odPct >= 1 ? 'READY [Q]' : `OD ${Math.floor(overdriveCharge)}%`, odX + 6, hpY + 13);

    // 6. Timer & Purged
    const mins = Math.floor(survivalTimer / 60);
    const secs = Math.floor(survivalTimer % 60);
    const timeStr = `TIME ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const tx = odX + 85;
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(timeStr, tx, hpY + 13);

    // Mini Matrix Status
    const stX = tx + 100;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText(`⚡x${projectileCount} ◎x${orbitalShieldCount}${droneCount > 0 ? ` ▲x${droneCount}` : ''}`, stX, hpY + 13);

    // 7. Botões de Mute e Pause no Canto Direito
    // Botão Pause
    const pauseBtnX = V_WIDTH - 180;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(pauseBtnX, 12, 75, 26);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(pauseBtnX, 12, 75, 26);
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state === GameState.PAUSED ? 'RESUME' : 'PAUSE', pauseBtnX + 37, 29);

    // Botão Mute
    const muteBtnX = V_WIDTH - 95;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(muteBtnX, 12, 75, 26);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(muteBtnX, 12, 75, 26);
    ctx.fillStyle = isMuted ? '#71717a' : '#fafafa';
    ctx.fillText(isMuted ? 'MUTED' : 'SOUND', muteBtnX + 37, 29);
  }

  function wrapText(context, text, maxWidth) {
    if (!text) return [];
    const words = String(text).split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  function drawUpgradeModal() {
    // Backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('// UPGRADE PROTOCOL DETECTED', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 160);

    ctx.fillStyle = '#71717a';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('SELECT MODULE [1, 2, 3] OR CLICK CARD', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 130);

    // Cards
    const cardW = UPGRADE_CARD_W;
    const cardH = UPGRADE_CARD_H;
    const cardGap = UPGRADE_CARD_GAP;
    const startX = (V_WIDTH - (3 * cardW + 2 * cardGap)) * 0.5;
    const cardY = (V_HEIGHT - cardH) * 0.5 + 20;
    const maxContentWidth = cardW - 32;

    for (let i = 0; i < upgradeOptions.length; i++) {
      const opt = upgradeOptions[i];
      const rx = startX + i * (cardW + cardGap);

      // Card Background & Technical Border
      ctx.fillStyle = 'rgba(9, 9, 11, 0.98)';
      ctx.fillRect(rx, cardY, cardW, cardH);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, cardY, cardW, cardH);

      // Key Badge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx + 28, cardY + 28, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090b';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText(String(i + 1), rx + 28, cardY + 33);

      // Icon
      ctx.fillStyle = '#fafafa';
      ctx.font = '28px sans-serif';
      ctx.fillText(opt.icon, rx + cardW * 0.5, cardY + 70);

      // Title (auto-wrapping / auto-fit to stay strictly inside the card)
      ctx.fillStyle = '#fafafa';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      const titleLines = wrapText(ctx, opt.title, maxContentWidth);
      const titleLineHeight = 18;
      const titleStartY = titleLines.length > 1 ? cardY + 104 : cardY + 112;
      for (let t = 0; t < titleLines.length; t++) {
        ctx.fillText(titleLines[t], rx + cardW * 0.5, titleStartY + t * titleLineHeight);
      }

      // Install Button UI
      const btnY = cardY + cardH - 42;
      ctx.fillStyle = '#18181b';
      ctx.fillRect(rx + 25, btnY, cardW - 50, 28);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 25, btnY, cardW - 50, 28);

      ctx.fillStyle = '#fafafa';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(`INSTALL [${i + 1}]`, rx + cardW * 0.5, btnY + 18);

      // Description (wrapped multiline, vertically centered between title and install button)
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 12.5px "Inter", -apple-system, sans-serif';
      const descLines = wrapText(ctx, opt.desc, maxContentWidth);
      const descLineHeight = 17;
      const titleBottom = titleStartY + (titleLines.length - 1) * titleLineHeight + 10;
      const availableDescHeight = btnY - titleBottom;
      const descBlockHeight = (descLines.length - 1) * descLineHeight;
      const descStartY = titleBottom + (availableDescHeight - descBlockHeight) * 0.5 + 4;

      for (let d = 0; d < descLines.length; d++) {
        ctx.fillText(descLines[d], rx + cardW * 0.5, descStartY + d * descLineHeight);
      }
    }
  }

  function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.94)';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    const cx = V_WIDTH * 0.5;
    const cy = V_HEIGHT * 0.5;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 36px "JetBrains Mono", monospace';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillText('PROTOCOL TERMINATED', cx, cy - 130);

    ctx.fillStyle = '#71717a';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('CORE SIGNAL COLLAPSED // REBOOT READY', cx, cy - 90);

    const mins = Math.floor(survivalTimer / 60);
    const secs = Math.floor(survivalTimer % 60);
    const stat1 = `TIME SURVIVED // ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const stat2 = `PROTOCOL LEVEL // ${level}`;
    const stat3 = `THREATS PURGED // ${enemiesKilled}`;
    const stat4 = `TOTAL XP LOGGED // ${score}`;

    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fafafa'; ctx.fillText(stat1, cx, cy - 40);
    ctx.fillStyle = '#e4e4e7'; ctx.fillText(stat2, cx, cy - 15);
    ctx.fillStyle = '#a1a1aa'; ctx.fillText(stat3, cx, cy + 10);
    ctx.fillStyle = '#71717a'; ctx.fillText(stat4, cx, cy + 35);

    // Botão 1: Restart Principal
    const btnW = 280;
    const btnH = 42;
    const btnX = cx - btnW * 0.5;
    const btnY = cy + 90;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#000000';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillText('RESTART PROTOCOL [R]', cx, btnY + 26);

    // Botões de Portfólio e GitHub
    const ghX = cx - 145;
    const ghY = cy + 145;
    const ghW = 140;
    const ghH = 36;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(ghX, ghY, ghW, ghH);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(ghX, ghY, ghW, ghH);
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('GITHUB REPO', ghX + 70, ghY + 22);

    const portX = cx + 5;
    const portY = cy + 145;
    const portW = 140;
    const portH = 36;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(portX, portY, portW, portH);
    ctx.strokeStyle = '#3f3f46';
    ctx.strokeRect(portX, portY, portW, portH);
    ctx.fillStyle = '#fafafa';
    ctx.fillText('PORTFOLIO', portX + 70, portY + 22);
  }

  // Initialize
  resetGame();
  canvas.focus();
  requestAnimationFrame(gameLoop);
})();
