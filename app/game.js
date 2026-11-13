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
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
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
      } else if (type === 'boss_spawn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.35);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'boss_defeat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.setValueAtTime(329.63, now + 0.12);
        osc.frequency.setValueAtTime(392.00, now + 0.24);
        osc.frequency.setValueAtTime(523.25, now + 0.36);
        osc.frequency.setValueAtTime(659.25, now + 0.48);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'mega_upgrade') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        osc.frequency.setValueAtTime(554.37, now + 0.16);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        osc.frequency.setValueAtTime(880, now + 0.32);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
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

  // Touch & Mobile Virtual Controls + Desktop Mouse Aim (Twin-Stick)
  let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const mouseAim = {
    x: V_WIDTH * 0.5,
    y: V_HEIGHT * 0.5 - 120,
    active: false
  };
  const touchControls = {
    joystick: {
      active: false,
      touchId: null,
      baseX: 140,
      baseY: V_HEIGHT - 140,
      currX: 140,
      currY: V_HEIGHT - 140,
      radius: 65,
      knobRadius: 28,
      dx: 0,
      dy: 0,
      strength: 0
    },
    aimJoystick: {
      active: false,
      touchId: null,
      baseX: V_WIDTH - 140,
      baseY: V_HEIGHT - 140,
      currX: V_WIDTH - 140,
      currY: V_HEIGHT - 140,
      radius: 65,
      knobRadius: 28,
      dx: 0,
      dy: 0,
      strength: 0
    },
    dashBtn: {
      x: V_WIDTH - 255,
      y: V_HEIGHT - 85,
      radius: 38,
      touchId: null
    },
    overdriveBtn: {
      x: V_WIDTH - 90,
      y: V_HEIGHT - 255,
      radius: 34,
      touchId: null
    }
  };

  function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function screenToWorld(sx, sy) {
    const cx = V_WIDTH * 0.5;
    const cy = V_HEIGHT * 0.5;
    return {
      x: cx + (sx - cx) / Math.max(0.2, currentZoom),
      y: cy + (sy - cy) / Math.max(0.2, currentZoom)
    };
  }

  // Multi-Touch Handlers (Celular / Tablet)
  function handleTouchStart(e) {
    initAudio();
    isTouchDevice = true;
    mouseAim.active = false;
    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = (t.clientX - rect.left) * scaleX;
      const ty = (t.clientY - rect.top) * scaleY;

      // 1. Botões do HUD (Mute e Pause)
      if (ty >= 10 && ty <= 45) {
        if (tx >= V_WIDTH - 95 && tx <= V_WIDTH - 20) {
          toggleMute();
          continue;
        }
        if (tx >= V_WIDTH - 180 && tx <= V_WIDTH - 105) {
          togglePause();
          continue;
        }
      }

      // 2. Despausar ao tocar na tela
      if (state === GameState.PAUSED) {
        togglePause();
        continue;
      }

      // 3. Seleção de Cartas de Upgrade no Mobile
      if (state === GameState.LEVEL_UP) {
        const cardW = UPGRADE_CARD_W;
        const cardH = UPGRADE_CARD_H;
        const cardGap = UPGRADE_CARD_GAP;
        const startX = (V_WIDTH - (3 * cardW + 2 * cardGap)) * 0.5;
        const cardY = (V_HEIGHT - cardH) * 0.5 + 20;

        for (let j = 0; j < upgradeOptions.length; j++) {
          const rx = startX + j * (cardW + cardGap);
          if (tx >= rx && tx <= rx + cardW && ty >= cardY && ty <= cardY + cardH) {
            selectUpgrade(j);
            break;
          }
        }
        continue;
      }

      // 4. Tela de Game Over no Mobile
      if (state === GameState.GAME_OVER) {
        const cx = V_WIDTH * 0.5;
        const cy = V_HEIGHT * 0.5;

        // Restart
        const btnX = cx - 140;
        const btnY = cy + 90;
        const btnW = 280;
        const btnH = 42;
        if (tx >= btnX && tx <= btnX + btnW && ty >= btnY && ty <= btnY + btnH) {
          resetGame();
          continue;
        }

        // GitHub
        const ghX = cx - 145;
        const ghY = cy + 145;
        const ghW = 140;
        const ghH = 36;
        if (tx >= ghX && tx <= ghX + ghW && ty >= ghY && ty <= ghY + ghH) {
          window.open('https://github.com/aarongmn7', '_blank');
          continue;
        }

        // Portfolio
        const portX = cx + 5;
        const portY = cy + 145;
        const portW = 140;
        const portH = 36;
        if (tx >= portX && tx <= portX + portW && ty >= portY && ty <= portY + portH) {
          window.open('https://aaron.dev.br/', '_blank');
          continue;
        }
        continue;
      }

      // 5. Controles Táticos de Gameplay (Modo PLAYING)
      if (state === GameState.PLAYING) {
        // Botão DASH (Canto Inferior Direito)
        const dDash = Math.hypot(tx - touchControls.dashBtn.x, ty - touchControls.dashBtn.y);
        if (dDash <= touchControls.dashBtn.radius + 18) {
          touchControls.dashBtn.touchId = t.identifier;
          triggerDash();
          continue;
        }

        // Botão OVERDRIVE (Canto Inferior Direito Acima do Dash)
        const dOd = Math.hypot(tx - touchControls.overdriveBtn.x, ty - touchControls.overdriveBtn.y);
        if (dOd <= touchControls.overdriveBtn.radius + 18) {
          touchControls.overdriveBtn.touchId = t.identifier;
          triggerOverdrive();
          continue;
        }

        // Joystick Virtual Analógico Esquerdo (Movimentação - Metade esquerda da tela)
        if (tx < V_WIDTH * 0.5 && touchControls.joystick.touchId === null) {
          touchControls.joystick.active = true;
          touchControls.joystick.touchId = t.identifier;
          touchControls.joystick.baseX = tx;
          touchControls.joystick.baseY = ty;
          touchControls.joystick.currX = tx;
          touchControls.joystick.currY = ty;
          touchControls.joystick.dx = 0;
          touchControls.joystick.dy = 0;
          touchControls.joystick.strength = 0;
          continue;
        }

        // Joystick Virtual Analógico Direito (Mira Twin-Stick - Metade direita da tela)
        if (tx >= V_WIDTH * 0.5 && touchControls.aimJoystick.touchId === null) {
          touchControls.aimJoystick.active = true;
          touchControls.aimJoystick.touchId = t.identifier;
          touchControls.aimJoystick.baseX = tx;
          touchControls.aimJoystick.baseY = ty;
          touchControls.aimJoystick.currX = tx;
          touchControls.aimJoystick.currY = ty;
          touchControls.aimJoystick.dx = 0;
          touchControls.aimJoystick.dy = 0;
          touchControls.aimJoystick.strength = 0;
          continue;
        }
      }
    }
  }

  function updateVirtualStick(stick, tx, ty) {
    const jx = tx - stick.baseX;
    const jy = ty - stick.baseY;
    const dist = Math.hypot(jx, jy);
    const maxR = stick.radius;

    if (dist > maxR) {
      stick.currX = stick.baseX + (jx / dist) * maxR;
      stick.currY = stick.baseY + (jy / dist) * maxR;
    } else {
      stick.currX = tx;
      stick.currY = ty;
    }

    if (dist > 8) {
      stick.dx = jx / dist;
      stick.dy = jy / dist;
      stick.strength = Math.min(1.0, dist / maxR);
    } else {
      stick.dx = 0;
      stick.dy = 0;
      stick.strength = 0;
    }
  }

  function handleTouchMove(e) {
    if (e.cancelable) e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = (t.clientX - rect.left) * scaleX;
      const ty = (t.clientY - rect.top) * scaleY;

      if (t.identifier === touchControls.joystick.touchId) {
        updateVirtualStick(touchControls.joystick, tx, ty);
      } else if (t.identifier === touchControls.aimJoystick.touchId) {
        updateVirtualStick(touchControls.aimJoystick, tx, ty);
      }
    }
  }

  function handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchControls.joystick.touchId) {
        touchControls.joystick.active = false;
        touchControls.joystick.touchId = null;
        touchControls.joystick.dx = 0;
        touchControls.joystick.dy = 0;
        touchControls.joystick.strength = 0;
        touchControls.joystick.baseX = 140;
        touchControls.joystick.baseY = V_HEIGHT - 140;
        touchControls.joystick.currX = 140;
        touchControls.joystick.currY = V_HEIGHT - 140;

        // Se estava movendo em diagonal no joystick e sem mira manual ativa, preserva o ângulo na soltura
        if (!touchControls.aimJoystick.active && lastDiagonalAngle !== null && diagonalGraceTimer > 0) {
          player.angle = lastDiagonalAngle;
        }
      }
      if (t.identifier === touchControls.aimJoystick.touchId) {
        touchControls.aimJoystick.active = false;
        touchControls.aimJoystick.touchId = null;
        touchControls.aimJoystick.dx = 0;
        touchControls.aimJoystick.dy = 0;
        touchControls.aimJoystick.strength = 0;
        touchControls.aimJoystick.baseX = V_WIDTH - 140;
        touchControls.aimJoystick.baseY = V_HEIGHT - 140;
        touchControls.aimJoystick.currX = V_WIDTH - 140;
        touchControls.aimJoystick.currY = V_HEIGHT - 140;
      }
      if (t.identifier === touchControls.dashBtn.touchId) {
        touchControls.dashBtn.touchId = null;
      }
      if (t.identifier === touchControls.overdriveBtn.touchId) {
        touchControls.overdriveBtn.touchId = null;
      }
    }
  }

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });
  window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // Mouse Aim (Desktop Twin-Stick)
  canvas.addEventListener('mousemove', (e) => {
    const m = getCanvasMousePos(e);
    mouseAim.x = m.x;
    mouseAim.y = m.y;
    mouseAim.active = true;
    isTouchDevice = false;
  });

  // Mouse Click (Desktop)
  canvas.addEventListener('click', (e) => {
    initAudio();
    const m = getCanvasMousePos(e);

    // Botões do HUD (Mute e Pause)
    if (m.y >= 10 && m.y <= 40) {
      if (m.x >= V_WIDTH - 95 && m.x <= V_WIDTH - 20) {
        toggleMute();
        return;
      }
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

      const btnX = cx - 140;
      const btnY = cy + 90;
      const btnW = 280;
      const btnH = 42;
      if (m.x >= btnX && m.x <= btnX + btnW && m.y >= btnY && m.y <= btnY + btnH) {
        resetGame();
        return;
      }

      const ghX = cx - 145;
      const ghY = cy + 145;
      const ghW = 140;
      const ghH = 36;
      if (m.x >= ghX && m.x <= ghX + ghW && m.y >= ghY && m.y <= ghY + ghH) {
        window.open('https://github.com/aarongmn7', '_blank');
        return;
      }

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

  // Player State & Directional Grace Tracking
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

  let lastDiagonalAngle = null;
  let diagonalGraceTimer = 0.0;
  const DIAGONAL_GRACE_DURATION = 0.18; // 180ms de janela de tolerância para parar perfeitamente em diagonais

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

  // Aim Assist & Linear Boss Progression
  let hasAimAssist = false;      // Inicialmente FALSO: mira manual e tiro rápido; vira Mega Upgrade no Nível 10!
  let aimAssistPenalty = 1.45;   // Penalidade inicial de cadência ao usar tiro automático (+45% cooldown)
  let isBossEncounter = false;   // Ativo quando o Boss do Nível 10/20/30 está no campo
  let currentBoss = null;        // Entidade do Boss Titã
  let isMegaUpgradeModal = false;// Modal dourado/ciano com 3 Mega Upgrades lendários
  let bossDefeatedCount = 0;

  // Progressão por Horda & Nível
  let hordeTotal = 6;
  let hordeRemainingToSpawn = 6;

  function startHordeForLevel(lvl) {
    if (lvl % 10 === 0) {
      // Nível de Boss (10, 20, 30...): escolta reduzida e finita
      hordeTotal = 4;
      hordeRemainingToSpawn = 4;
    } else {
      // Hordas normais: menos mobs na tela, porém mais resistentes
      hordeTotal = Math.min(22, 5 + Math.floor(lvl * 1.1));
      hordeRemainingToSpawn = hordeTotal;
    }
    spawnTimer = 0.4;
  }

  // Dynamic Camera Zoom
  let currentZoom = 1.0;
  let targetZoom = 1.0;

  function getArenaBounds() {
    const halfVisibleW = (V_WIDTH * 0.5) / Math.max(0.2, currentZoom);
    const halfVisibleH = (V_HEIGHT * 0.5) / Math.max(0.2, currentZoom);
    const margin = 28;
    return {
      minX: V_WIDTH * 0.5 - halfVisibleW + margin,
      maxX: V_WIDTH * 0.5 + halfVisibleW - margin,
      minY: V_HEIGHT * 0.5 - halfVisibleH + margin + 45,
      maxY: V_HEIGHT * 0.5 + halfVisibleH - margin,
      width: (halfVisibleW * 2) - margin * 2,
      height: (halfVisibleH * 2) - margin * 2 - 45
    };
  }

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

    lastDiagonalAngle = null;
    diagonalGraceTimer = 0.0;

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

    hasAimAssist = false;
    aimAssistPenalty = 1.45;
    isBossEncounter = false;
    currentBoss = null;
    isMegaUpgradeModal = false;
    bossDefeatedCount = 0;

    currentZoom = 1.0;
    targetZoom = 1.0;

    touchControls.joystick.active = false;
    touchControls.joystick.touchId = null;
    touchControls.joystick.dx = 0;
    touchControls.joystick.dy = 0;
    touchControls.joystick.strength = 0;
    touchControls.joystick.baseX = 140;
    touchControls.joystick.baseY = V_HEIGHT - 140;
    touchControls.joystick.currX = 140;
    touchControls.joystick.currY = V_HEIGHT - 140;
    touchControls.aimJoystick.active = false;
    touchControls.aimJoystick.touchId = null;
    touchControls.aimJoystick.dx = 0;
    touchControls.aimJoystick.dy = 0;
    touchControls.aimJoystick.strength = 0;
    touchControls.aimJoystick.baseX = V_WIDTH - 140;
    touchControls.aimJoystick.baseY = V_HEIGHT - 140;
    touchControls.aimJoystick.currX = V_WIDTH - 140;
    touchControls.aimJoystick.currY = V_HEIGHT - 140;
    touchControls.dashBtn.touchId = null;
    touchControls.overdriveBtn.touchId = null;

    lasers.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
    xpGems.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    empWaves.length = 0;

    spawnTimer = 0.0;
    currentSpawnInterval = BASE_SPAWN_INTERVAL;
    startHordeForLevel(1);
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

      // Dynamic Camera Zoom Calculation based on Level and Mobility
      // Zoom mais afastado conforme o nível sobe para dar mais visão de arena e respiro contra hordas/bosses
      const levelZoom = Math.max(0.35, 1.0 - (level - 1) * 0.032);
      const dashBonus = dashActiveTimer > 0 ? 0.04 : 0.0;
      targetZoom = Math.max(0.32, levelZoom - dashBonus);
      currentZoom += (targetZoom - currentZoom) * Math.min(1.0, 3.5 * dt);

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

      // Elite Threat Anomaly Warning & Trigger (somente fora de confrontos com Boss)
      if (!isBossEncounter && survivalTimer >= nextEliteTime) {
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

      // Boss Logic (Atualiza movimento e padrões de tiro se o Chefe estiver ativo)
      if (currentBoss) {
        updateBoss(dt);
      }

      // Weapons Combat (Manual ou Aim Assist 360°)
      handleCombat(dt);

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

      // Enemy Spawner por Horda (Sem spawn infinito por tempo)
      if (hordeRemainingToSpawn > 0) {
        spawnTimer += dt;
        currentSpawnInterval = isBossEncounter ? 2.4 : Math.max(0.65, 1.15 - (level * 0.015));
        if (spawnTimer >= currentSpawnInterval) {
          spawnTimer = 0;
          spawnEnemyWave();
        }
      } else if (!isBossEncounter && enemies.length === 0) {
        // Matou toda a horda do nível atual -> avança para o próximo nível!
        levelUp();
        return;
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
    const bounds = getArenaBounds();

    if (diagonalGraceTimer > 0) {
      diagonalGraceTimer = Math.max(0, diagonalGraceTimer - dt);
    }

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

      player.x = Math.max(bounds.minX, Math.min(bounds.maxX, player.x));
      player.y = Math.max(bounds.minY, Math.min(bounds.maxY, player.y));
      gridOffsetX += player.vx * dt * 0.35;
      gridOffsetY += player.vy * dt * 0.35;
      return;
    }

    let dx = 0;
    let dy = 0;

    // 1. Suporte a Joystick Virtual Touch (Celular / Tablet)
    if (touchControls.joystick.active && touchControls.joystick.strength > 0.05) {
      dx = touchControls.joystick.dx * touchControls.joystick.strength;
      dy = touchControls.joystick.dy * touchControls.joystick.strength;
    } else {
      // 2. Teclado WASD / Setas (Desktop)
      if (keys['w'] || keys['keyw'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['keys'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['keya'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['keyd'] || keys['arrowright']) dx += 1;
    }

    // Mira Twin-Stick independente (Joystick Direito no Mobile ou Mouse no Desktop)
    const hasManualAimStick = touchControls.aimJoystick.active && touchControls.aimJoystick.strength > 0.1;
    const hasManualMouseAim = !isTouchDevice && mouseAim.active;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const normDx = dx / len;
      const normDy = dy / len;

      const targetSpeed = player.speed * Math.min(1.0, len);
      const targetVx = normDx * targetSpeed;
      const targetVy = normDy * targetSpeed;
      const accelFactor = Math.min(1.0, 18.0 * dt);
      player.vx += (targetVx - player.vx) * accelFactor;
      player.vy += (targetVy - player.vy) * accelFactor;

      if (!hasManualAimStick && !hasManualMouseAim) {
        // Fallback: sem mira manual ativa, nave aponta na direção do movimento (com grace diagonal)
        const isDiagonalInput = (Math.abs(normDx) > 0.35 && Math.abs(normDy) > 0.35);

        if (isDiagonalInput) {
          lastDiagonalAngle = Math.atan2(normDy, normDx);
          diagonalGraceTimer = DIAGONAL_GRACE_DURATION;
          player.angle = lastDiagonalAngle;
        } else {
          if (diagonalGraceTimer > 0 && lastDiagonalAngle !== null) {
            player.angle = lastDiagonalAngle;
          } else {
            player.angle = Math.atan2(normDy, normDx);
            lastDiagonalAngle = null;
          }
        }
      }

      // Thruster exhaust particles (Monochrome Zinc & White)
      if (Math.random() < 0.6) {
        const tx = player.x - normDx * 20;
        const ty = player.y - normDy * 20;
        const pColors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'];
        particles.push({
          x: tx + (Math.random() - 0.5) * 8,
          y: ty + (Math.random() - 0.5) * 8,
          vx: -normDx * (60 + Math.random() * 60) + (Math.random() - 0.5) * 20,
          vy: -normDy * (60 + Math.random() * 60) + (Math.random() - 0.5) * 20,
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

      // Ao soltar todas as teclas/analógico sem mira manual, preserva o ângulo diagonal de repouso
      if (!hasManualAimStick && !hasManualMouseAim && lastDiagonalAngle !== null && diagonalGraceTimer > 0) {
        player.angle = lastDiagonalAngle;
      }
    }

    // Aplica mira Twin-Stick quando ativa
    if (hasManualAimStick) {
      player.angle = Math.atan2(touchControls.aimJoystick.dy, touchControls.aimJoystick.dx);
    } else if (hasManualMouseAim) {
      const worldMouse = screenToWorld(mouseAim.x, mouseAim.y);
      const mdx = worldMouse.x - player.x;
      const mdy = worldMouse.y - player.y;
      if (Math.hypot(mdx, mdy) > 4) {
        player.angle = Math.atan2(mdy, mdx);
      }
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Arena Clamping dinâmico expandido com o zoom
    player.x = Math.max(bounds.minX, Math.min(bounds.maxX, player.x));
    player.y = Math.max(bounds.minY, Math.min(bounds.maxY, player.y));

    gridOffsetX += player.vx * dt * 0.35;
    gridOffsetY += player.vy * dt * 0.35;
  }

  function handleCombat(dt) {
    laserCooldownTimer -= dt;
    const speedBoost = isOverdriveActive ? 0.45 : 1.0;
    // Quando tem Aim Assist, inicialmente a cadência tem uma penalidade (+45% cooldown) para balanceamento
    const penalty = hasAimAssist ? aimAssistPenalty : 1.0;
    const currentCooldown = BASE_LASER_COOLDOWN * fireRateMultiplier * speedBoost * penalty;

    if (laserCooldownTimer <= 0) {
      if (hasAimAssist) {
        // Aim Assist: auto-mira em 360° no inimigo ou boss mais próximo
        const target = findNearestTarget();
        if (target) {
          fireLasers(target.x, target.y);
          laserCooldownTimer = currentCooldown;
          playSynthSound('laser');
        } else {
          // Sem inimigo: dispara frontalmente
          const fx = player.x + Math.cos(player.angle) * 220;
          const fy = player.y + Math.sin(player.angle) * 220;
          fireLasers(fx, fy);
          laserCooldownTimer = currentCooldown;
          playSynthSound('laser');
        }
      } else {
        // Modo Frontal Fixo (sem Aim Assist): sempre mirado para a frente da nave!
        const fx = player.x + Math.cos(player.angle) * 220;
        const fy = player.y + Math.sin(player.angle) * 220;
        fireLasers(fx, fy);
        laserCooldownTimer = currentCooldown;
        playSynthSound('laser');
      }
    }
  }

  function findNearestTarget() {
    let closest = null;
    let minDist = Infinity;

    // Prioriza o Boss se estiver ativo e próximo
    if (currentBoss && currentBoss.hp > 0) {
      const db = Math.hypot(player.x - currentBoss.x, player.y - currentBoss.y);
      if (db < 700) return currentBoss;
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest || currentBoss;
  }

  function spawnBoss(bossLevel) {
    isBossEncounter = true;
    const b = getArenaBounds();
    const bossHp = 1000 + (bossLevel * 80);
    const bossNames = {
      10: 'TITAN PROTOCOL: CYBER GOLIATH T-10',
      20: 'APEX GLITCH LEVIATHAN T-20',
      30: 'OMEGA OVERMIND CORE T-30'
    };
    const bName = bossNames[bossLevel] || `TITAN PROTOCOL T-${bossLevel}`;

    currentBoss = {
      name: bName,
      level: bossLevel,
      x: V_WIDTH * 0.5,
      y: b.minY - 120,
      targetY: b.minY + 110,
      hp: bossHp,
      maxHp: bossHp,
      radius: 52,
      speed: 46,
      shootTimer: 2.0,
      phaseTimer: 0,
      color: '#ffffff',
      isBoss: true
    };

    screenShake = 18;
    playSynthSound('boss_spawn');
    eliteWarningTimer = 4.0;
  }

  function updateBoss(dt) {
    if (!currentBoss || currentBoss.hp <= 0) return;
    const b = currentBoss;

    // Movimentação do Boss (descida e patrulha senoidal elegante)
    if (b.y < b.targetY) {
      b.y += 110 * dt;
    } else {
      b.phaseTimer += dt;
      b.x = (V_WIDTH * 0.5) + Math.sin(b.phaseTimer * 0.75) * ((V_WIDTH * 0.5) - 220);
      b.y = b.targetY + Math.cos(b.phaseTimer * 1.5) * 30;
    }

    // Ataques do Boss
    b.shootTimer -= dt;
    if (b.shootTimer <= 0) {
      b.shootTimer = 2.0 + Math.random() * 0.4;
      const aimAngle = Math.atan2(player.y - b.y, player.x - b.x);

      // Rajada quíntupla de esferas de plasma em leque
      for (let s = -2; s <= 2; s++) {
        const sang = aimAngle + s * 0.18;
        enemyBullets.push({
          x: b.x + Math.cos(sang) * (b.radius + 10),
          y: b.y + Math.sin(sang) * (b.radius + 10),
          vx: Math.cos(sang) * 280,
          vy: Math.sin(sang) * 280,
          radius: 7,
          damage: 18,
          life: 4.5
        });
      }
      playSynthSound('enemy_shot');
    }

    // Colisão direta com o jogador
    if (player.invulnerableTimer <= 0 && Math.hypot(b.x - player.x, b.y - player.y) <= b.radius + 18) {
      player.health -= 25;
      player.invulnerableTimer = 0.7;
      screenShake = 14;
      createSparks(player.x, player.y, '#ffffff', 14);
      addFloatingText(player.x, player.y - 25, '-25 HP [BOSS COLLISION]', '#ef4444');
      playSynthSound('hit');

      if (player.health <= 0) {
        triggerGameOver();
      }
    }
  }

  function defeatBoss() {
    if (!currentBoss) return;
    bossDefeatedCount++;
    score += currentBoss.maxHp * 5;
    createExplosion(currentBoss.x, currentBoss.y, '#ffffff', 55);
    createExplosion(currentBoss.x, currentBoss.y, '#00f0ff', 35);
    screenShake = 22;
    playSynthSound('boss_defeat');

    // Drops épicos de XP
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      xpGems.push({
        x: currentBoss.x + Math.cos(ang) * 45,
        y: currentBoss.y + Math.sin(ang) * 45,
        vx: Math.cos(ang) * 80,
        vy: Math.sin(ang) * 80,
        value: 60,
        isVacuumed: true
      });
    }

    // Cura tática de 40% do HP Máximo
    player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.40);
    addFloatingText(player.x, player.y - 45, '★ SECTOR TITAN PURGED! ★', '#ffffff');
    addFloatingText(player.x, player.y - 70, '+40% REPAIR PROTOCOL', '#10b981');

    currentBoss = null;
    isBossEncounter = false;

    // Dispara a entrega de 3 MEGA UPGRADES!
    setTimeout(() => {
      openMegaUpgradeModal();
    }, 600);
  }

  function fireLasers(tx, ty) {
    const baseAngle = Math.atan2(ty - player.y, tx - player.x);
    const spreadStep = 0.12;
    const startAngle = baseAngle - ((projectileCount - 1) * 0.5) * spreadStep;

    for (let i = 0; i < projectileCount; i++) {
      const ang = startAngle + i * spreadStep;
      const isCrit = Math.random() < critChance;
      const dmg = (BASE_LASER_DAMAGE + (level - 1) * 1.5) * (isCrit ? critMultiplier : 1.0);

      lasers.push({
        x: player.x + Math.cos(ang) * 18,
        y: player.y + Math.sin(ang) * 18,
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

      // Dano contínuo por contato no Boss
      if (currentBoss && currentBoss.hp > 0) {
        if (Math.hypot(pos.x - currentBoss.x, pos.y - currentBoss.y) <= orbHitRadius + currentBoss.radius) {
          currentBoss.hp -= ORBITAL_SHIELD_DAMAGE * dt * 2.8;
          createSparks(pos.x, pos.y, '#ffffff', 2);
          if (currentBoss.hp <= 0) {
            defeatBoss();
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
        let minDist = 480;

        if (currentBoss && currentBoss.hp > 0) {
          const db = Math.hypot(dx - currentBoss.x, dy - currentBoss.y);
          if (db < minDist) {
            nearest = currentBoss;
            minDist = db;
          }
        }

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

      // Dano de onda EMP no Boss
      if (currentBoss && currentBoss.hp > 0) {
        const distB = Math.hypot(w.x - currentBoss.x, w.y - currentBoss.y);
        if (Math.abs(distB - w.radius) < 30) {
          currentBoss.hp -= w.damage * dt * 4.5;
          if (currentBoss.hp <= 0) {
            defeatBoss();
          }
        }
      }

      if (w.radius >= w.maxRadius) {
        empWaves.splice(i, 1);
      }
    }
  }

  function spawnEnemyWave() {
    if (hordeRemainingToSpawn <= 0) return;

    // Limita simultâneos na tela para evitar poluição visual e sufoco excessivo
    const maxSimultaneous = isBossEncounter ? 4 : 10;
    if (enemies.length >= maxSimultaneous) return;

    const b = getArenaBounds();
    const batchMax = isBossEncounter ? 2 : Math.min(4, 2 + Math.floor(level * 0.15));
    const spawnCount = Math.min(batchMax, hordeRemainingToSpawn, maxSimultaneous - enemies.length);
    const offset = 40;

    for (let s = 0; s < spawnCount; s++) {
      hordeRemainingToSpawn--;
      let spawnX = 0;
      let spawnY = 0;
      const edge = Math.floor(Math.random() * 4);

      switch (edge) {
        case 0: spawnX = b.minX + Math.random() * b.width; spawnY = b.minY - offset; break;
        case 1: spawnX = b.maxX + offset; spawnY = b.minY + Math.random() * b.height; break;
        case 2: spawnX = b.minX + Math.random() * b.width; spawnY = b.maxY + offset; break;
        case 3: spawnX = b.minX - offset; spawnY = b.minY + Math.random() * b.height; break;
      }

      const roll = Math.random();
      let type = 'mite';
      // Menos mobs, porém com mais vida escalada pelo nível
      let hp = 45 + (level - 1) * 14;
      let speed = 92 + (Math.random() - 0.5) * 24;
      let radius = 14;
      let color = '#d4d4d8'; // Zinc 300

      if (level >= 2 && roll < 0.28) {
        type = 'sniper';
        hp = 60 + (level - 1) * 18;
        speed = 82;
        radius = 16;
        color = '#e4e4e7';
      } else if (level >= 3 && roll < 0.55) {
        type = 'byte';
        hp = 85 + (level - 1) * 24;
        speed = 68;
        radius = 18;
        color = '#ffffff'; // Pure White
      } else if (level >= 5 && roll < 0.22) {
        type = 'corruptor';
        hp = 220 + (level - 1) * 55;
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
  }

  function updateLasers(dt) {
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
      l.hitEnemies = l.hitEnemies || new Set();

      // Colisão com o Boss
      if (currentBoss && currentBoss.hp > 0 && !l.hitEnemies.has(currentBoss)) {
        if (Math.hypot(l.x - currentBoss.x, l.y - currentBoss.y) <= currentBoss.radius + 8) {
          l.hitEnemies.add(currentBoss);
          currentBoss.hp -= l.damage;
          l.pierce = (l.pierce !== undefined ? l.pierce : 1) - 1;

          if (l.isCrit) {
            screenShake = Math.max(screenShake, 5);
            createSparks(l.x, l.y, '#ffffff', 8);
            addFloatingText(currentBoss.x, currentBoss.y - 30, `⚡CRIT! ${Math.floor(l.damage)}`, '#00f0ff');
          } else {
            createSparks(l.x, l.y, '#ffffff', 4);
          }
          playSynthSound('hit');

          if (currentBoss.hp <= 0) {
            defeatBoss();
          }

          if (l.pierce <= 0) {
            lasers.splice(i, 1);
            continue;
          }
        }
      }

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
    // Gemas de dados agora alimentam o Score e aceleram a carga de Overdrive
    score += amt;
    if (!isOverdriveActive && overdriveCharge < 100) {
      overdriveCharge = Math.min(100, overdriveCharge + Math.max(1.5, amt * 0.12));
    }
  }

  function levelUp() {
    level++;
    currentXP = 0;
    targetXP = Math.round(BASE_XP_LEVEL_UP * Math.pow(1.18, level - 1));

    // Bônus passivo a cada nível: +4% Velocidade e +5% Max HP (com cura de 10%)
    player.speed *= 1.04;
    player.maxHealth *= 1.05;
    player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.10);

    addFloatingText(player.x, player.y - 45, `HORDA ${level - 1} LIMPA!`, '#fafafa');
    addFloatingText(player.x, player.y - 70, `PROTOCOL LEVEL ${level}`, '#00f0ff');
    createExplosion(player.x, player.y, '#ffffff', 32);
    playSynthSound('levelup');

    // Milestone Vacuum: Atração total de gemas no mapa
    for (const g of xpGems) {
      g.isVacuumed = true;
    }

    // A cada 10 níveis (Nível 10, 20, 30...), INICIA O BOSS DO SETOR!
    if (level % 10 === 0) {
      startHordeForLevel(level);
      spawnBoss(level);
    } else {
      openUpgradeModal();
    }
  }

  function openUpgradeModal() {
    state = GameState.LEVEL_UP;
    isMegaUpgradeModal = false;
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

  function openMegaUpgradeModal() {
    state = GameState.LEVEL_UP;
    isMegaUpgradeModal = true;
    playSynthSound('mega_upgrade');

    const megaCatalog = [];

    // 1. Aim Assist / Mira Automática 360° (ou Overclock V2 se já tiver)
    if (!hasAimAssist) {
      megaCatalog.push({
        id: 'mega_aim_assist',
        title: 'MIRA AUTOMÁTICA // AIM ASSIST',
        desc: 'Instala IA preditiva de tiro 360° no alvo mais próximo. (Cadência inicial: +45% cooldown).',
        icon: '🎯'
      });
    } else {
      megaCatalog.push({
        id: 'mega_aim_turbo',
        title: 'OVERCLOCK AIM ASSIST V2',
        desc: 'Elimina a lentidão do tiro automático (+45% velocidade) e adiciona +25% de Chance Crítica.',
        icon: '⚡'
      });
    }

    // 2. Hiper Canhão Overcharge
    megaCatalog.push({
      id: 'mega_overcharge',
      title: 'HIPER CANHÃO OVERCHARGE',
      desc: '+3 Canhões frontais simultâneos, +50% dano base permanente e feixes gigantes com perfuração +2.',
      icon: '💥'
    });

    // 3. Bastião Orbital Titânico
    megaCatalog.push({
      id: 'mega_orbital_bastion',
      title: 'BASTIÃO ORBITAL TITÂNICO',
      desc: '+3 Escudos orbitais blindados que deflectem 100% dos tiros inimigos e causam dobro de dano.',
      icon: '🛡️'
    });

    upgradeOptions = megaCatalog.slice(0, 3);
  }

  function selectUpgrade(idx) {
    if (idx < 0 || idx >= upgradeOptions.length) return;
    const choice = upgradeOptions[idx];

    if (choice.id.startsWith('mega_')) {
      switch (choice.id) {
        case 'mega_aim_assist':
          hasAimAssist = true;
          addFloatingText(player.x, player.y - 50, 'AIM ASSIST ONLINE!', '#00f0ff');
          break;
        case 'mega_aim_turbo':
          aimAssistPenalty = 1.0;
          critChance = Math.min(0.85, critChance + 0.25);
          critMultiplier += 0.5;
          addFloatingText(player.x, player.y - 50, 'AIM ASSIST OVERCLOCKED!', '#00f0ff');
          break;
        case 'mega_overcharge':
          projectileCount += 3;
          laserPierce += 2;
          player.maxHealth += 30;
          addFloatingText(player.x, player.y - 50, 'OVERCHARGE ENGAGED!', '#ffffff');
          break;
        case 'mega_orbital_bastion':
          hasOrbitalShield = true;
          orbitalShieldCount += 3;
          addFloatingText(player.x, player.y - 50, 'TITAN BASTION ACTIVE!', '#ffffff');
          break;
      }
      isMegaUpgradeModal = false;
      level++;
      startHordeForLevel(level);
      state = GameState.PLAYING;
      return;
    }

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

    isMegaUpgradeModal = false;
    startHordeForLevel(level);
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

    // Limpa 100% da tela antes de qualquer transform de zoom/shake (evita rastros nas bordas)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

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

    // 1. Technical Grid
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

    // 6. Enemies & Sector Titan Boss
    drawEnemies();
    if (currentBoss) {
      drawBoss();
    }

    // 7. Player Ship, Ghost Trails, Drones & Shields
    if (state !== GameState.GAME_OVER) {
      drawGhostTrails();
      drawDrones();
      drawPlayer();
      if (hasOrbitalShield) drawOrbitalShields();

      // Guia Laser Frontal Fixo (Quando o jogador ainda não desbloqueou o Aim Assist)
      if (!hasAimAssist && state === GameState.PLAYING) {
        const aimAng = player.angle; // Sempre alinhado à frente da nave!

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(aimAng) * 160, player.y + Math.sin(aimAng) * 160);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(player.x + Math.cos(aimAng) * 160, player.y + Math.sin(aimAng) * 160, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Retículo de Mira Cibernético (Quando o jogador desbloqueou o Aim Assist)
      if (hasAimAssist && state === GameState.PLAYING) {
        const lockedTarget = findNearestTarget();
        if (lockedTarget) {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          const tr = lockedTarget.radius + 8;
          const tx = lockedTarget.x;
          const ty = lockedTarget.y;
          const blen = 6;

          ctx.beginPath();
          ctx.moveTo(tx - tr, ty - tr + blen); ctx.lineTo(tx - tr, ty - tr); ctx.lineTo(tx - tr + blen, ty - tr);
          ctx.moveTo(tx + tr - blen, ty - tr); ctx.lineTo(tx + tr, ty - tr); ctx.lineTo(tx + tr, ty - tr + blen);
          ctx.moveTo(tx - tr, ty + tr - blen); ctx.lineTo(tx - tr, ty + tr); ctx.lineTo(tx - tr + blen, ty + tr);
          ctx.moveTo(tx + tr - blen, ty + tr); ctx.lineTo(tx + tr, ty + tr); ctx.lineTo(tx + tr, ty + tr - blen);
          ctx.stroke();

          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(tx, ty, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // 8. Particles
    drawParticles();

    // 9. Floating Combat Texts
    drawFloatingTexts();

    ctx.restore(); // Fecha Dynamic Zoom
    ctx.restore(); // Fecha Screen Shake

    // HUD e Overlays Fixos (Invariantes ao zoom)
    // 10. Tactical Radar Sensor & Controles Virtuais Touch
    if (state !== GameState.GAME_OVER) {
      drawTacticalRadar();
      drawTouchControls();
    }

    // 11. Elite Warning Banner
    drawEliteWarning();

    // 12. Top HUD Bar (always stays stationary, no screen shake)
    drawHUD();

    // 12.1 Boss Health Bar (Exibida diretamente abaixo do HUD durante combate)
    drawBossHealthBar();

    // 13. Modals & Overlays
    if (state === GameState.LEVEL_UP) {
      drawUpgradeModal();
    } else if (state === GameState.GAME_OVER) {
      drawGameOverScreen();
    } else if (state === GameState.PAUSED) {
      drawPauseOverlay();
    }
  }

  function drawBoss() {
    if (!currentBoss || currentBoss.hp <= 0) return;
    const b = currentBoss;

    ctx.save();
    ctx.translate(b.x, b.y);

    // 1. Aura de pulso de escudo gigante
    const pulseR = b.radius * (1.18 + Math.sin(survivalTimer * 6) * 0.08);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Anel secundário ciano rotativo
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, b.radius * 1.35, survivalTimer * 2, survivalTimer * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Casco Hexagonal Dreadnought
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = '#09090b';

    const segs = 6;
    ctx.beginPath();
    for (let s = 0; s <= segs; s++) {
      const a = (s * Math.PI * 2) / segs + Math.PI / 6;
      const px = Math.cos(a) * b.radius;
      const py = Math.sin(a) * b.radius;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Torretas Laterais de Plasma
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.fillRect(-b.radius - 8, -12, 12, 24);
    ctx.strokeRect(-b.radius - 8, -12, 12, 24);
    ctx.fillRect(b.radius - 4, -12, 12, 24);
    ctx.strokeRect(b.radius - 4, -12, 12, 24);

    // 4. Núcleo de Reator Cibernético
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 14 + Math.sin(survivalTimer * 10) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // 5. Rótulo de Alerta Tático
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ef4444';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ SECTOR TITAN CORE', 0, -b.radius - 14);

    ctx.restore();
  }

  function drawBossHealthBar() {
    if (!currentBoss || currentBoss.hp <= 0) return;
    const barW = 540;
    const barH = 16;
    const bx = (V_WIDTH - barW) * 0.5;
    const by = 58;
    const pct = Math.max(0, currentBoss.hp / currentBoss.maxHp);

    ctx.save();
    // Glass background
    ctx.fillStyle = 'rgba(9, 9, 11, 0.92)';
    ctx.fillRect(bx - 6, by - 18, barW + 12, barH + 24);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 6, by - 18, barW + 12, barH + 24);

    // Title
    ctx.fillStyle = '#ef4444';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚠ ${currentBoss.name}`, bx, by - 5);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fafafa';
    ctx.fillText(`${Math.ceil(currentBoss.hp)} / ${currentBoss.maxHp} HP (${Math.ceil(pct * 100)}%)`, bx + barW, by - 5);

    // HP Bar background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bx, by, barW, barH);

    // HP Bar fill
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx, by, barW * pct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);

    ctx.restore();
  }

  function drawArenaPerimeter() {
    const b = getArenaBounds();
    ctx.save();
    ctx.strokeStyle = isBossEncounter ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(b.minX, b.minY, b.width, b.height);
    ctx.setLineDash([]);

    // Cantoneiras técnicas nos quatro vértices
    const corners = [
      [b.minX, b.minY],
      [b.maxX, b.minY],
      [b.minX, b.maxY],
      [b.maxX, b.maxY]
    ];
    ctx.strokeStyle = isBossEncounter ? '#ef4444' : '#ffffff';
    ctx.lineWidth = 2;
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = isBossEncounter ? '#ef4444' : 'rgba(255, 255, 255, 0.22)';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SECTOR ${Math.floor((level - 1) / 10) + 1} // BOUNDARY ${Math.round(b.width)}x${Math.round(b.height)} // ZOOM ${Math.round(currentZoom * 100)}%`, b.minX + 12, b.minY + 16);
    ctx.restore();
  }

  function drawCyberGrid() {
    const cellSize = 60;
    const ox = gridOffsetX % cellSize;
    const oy = gridOffsetY % cellSize;
    const b = getArenaBounds();
    const minGridX = Math.min(-1200, b.minX - 300);
    const maxGridX = Math.max(V_WIDTH + 1200, b.maxX + 300);
    const minGridY = Math.min(-1200, b.minY - 300);
    const maxGridY = Math.max(V_HEIGHT + 1200, b.maxY + 300);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    for (let x = minGridX + ox; x <= maxGridX; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, minGridY);
      ctx.lineTo(x, maxGridY);
      ctx.stroke();
    }

    for (let y = minGridY + oy; y <= maxGridY; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(minGridX, y);
      ctx.lineTo(maxGridX, y);
      ctx.stroke();
    }

    // Cruzes técnicas de radar nos nós principais (blueprint minimalista)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = minGridX + ox; x <= maxGridX; x += cellSize * 2) {
      for (let y = minGridY + oy; y <= maxGridY; y += cellSize * 2) {
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
    const radarX = V_WIDTH - 65;
    const radarY = 118;
    const radarRadius = 38;
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
    ctx.fillText('RADAR 360°', radarX, radarY + radarRadius + 13);

    ctx.restore();
  }

  function drawVirtualStickVisual(stick, accentColor, shadowColor, idleX, idleY, idleLabel) {
    if (stick.active) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.50)';
      ctx.beginPath();
      ctx.arc(stick.baseX, stick.baseY, stick.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stick.baseX - stick.radius * 0.7, stick.baseY); ctx.lineTo(stick.baseX + stick.radius * 0.7, stick.baseY);
      ctx.moveTo(stick.baseX, stick.baseY - stick.radius * 0.7); ctx.lineTo(stick.baseX, stick.baseY + stick.radius * 0.7);
      ctx.stroke();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(stick.baseX, stick.baseY);
      ctx.lineTo(stick.currX, stick.currY);
      ctx.stroke();

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(stick.currX, stick.currY, stick.knobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(stick.currX, stick.currY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(idleX, idleY, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idleLabel, idleX, idleY + 4);
    }
  }

  function drawTouchControls() {
    if (state !== GameState.PLAYING) return;

    ctx.save();

    // Retícula tática do Mouse no Desktop (sem poluir com botões touch)
    if (!isTouchDevice) {
      if (mouseAim.active) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouseAim.x, mouseAim.y, 10, 0, Math.PI * 2);
        ctx.moveTo(mouseAim.x - 16, mouseAim.y); ctx.lineTo(mouseAim.x - 6, mouseAim.y);
        ctx.moveTo(mouseAim.x + 6, mouseAim.y); ctx.lineTo(mouseAim.x + 16, mouseAim.y);
        ctx.moveTo(mouseAim.x, mouseAim.y - 16); ctx.lineTo(mouseAim.x, mouseAim.y - 6);
        ctx.moveTo(mouseAim.x, mouseAim.y + 6); ctx.lineTo(mouseAim.x, mouseAim.y + 16);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mouseAim.x, mouseAim.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // 1. Joysticks Virtuais Twin-Stick (Somente em dispositivos Touch/Mobile)
    drawVirtualStickVisual(touchControls.joystick, 'rgba(0, 240, 255, 0.65)', '#00f0ff', 140, V_HEIGHT - 140, 'NAV // STICK');
    drawVirtualStickVisual(touchControls.aimJoystick, 'rgba(255, 42, 133, 0.70)', '#ff2a85', V_WIDTH - 140, V_HEIGHT - 140, 'AIM // STICK');

    // 2. Botão de DASH (Canto Inferior Direito)
    const dash = touchControls.dashBtn;
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
    ctx.beginPath();
    ctx.arc(dash.x, dash.y, dash.radius, 0, Math.PI * 2);
    ctx.fill();

    const isDashReady = dashCooldownTimer <= 0;
    ctx.strokeStyle = isDashReady ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = isDashReady ? 2 : 1.5;
    if (isDashReady) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arco de cooldown do Dash
    if (!isDashReady) {
      const dashPct = 1 - (dashCooldownTimer / DASH_COOLDOWN);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dash.x, dash.y, dash.radius, -Math.PI * 0.5, -Math.PI * 0.5 + dashPct * Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = isDashReady ? '#ffffff' : '#71717a';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText('DASH', dash.x, dash.y + 4);
    ctx.fillStyle = '#52525b';
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillText('[SPACE]', dash.x, dash.y + 16);

    // 3. Botão de OVERDRIVE (Canto Inferior Direito Acima do Dash)
    const od = touchControls.overdriveBtn;
    const isOdReady = overdriveCharge >= 100;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
    ctx.beginPath();
    ctx.arc(od.x, od.y, od.radius, 0, Math.PI * 2);
    ctx.fill();

    if (isOdReady) {
      const pulseBlur = 10 + Math.sin(survivalTimer * 8) * 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = pulseBlur;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const odPct = Math.min(1, overdriveCharge / 100);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(od.x, od.y, od.radius, -Math.PI * 0.5, -Math.PI * 0.5 + odPct * Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = isOdReady ? '#00f0ff' : '#71717a';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(isOdReady ? 'OD READY' : `OD ${Math.floor(overdriveCharge)}%`, od.x, od.y + 3);
    ctx.fillStyle = '#52525b';
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillText('[Q]', od.x, od.y + 14);

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

    // 3. Barra de Progresso da Horda
    const hordeAliveOrPending = hordeRemainingToSpawn + enemies.length;
    const hordeKilled = Math.max(0, hordeTotal - hordeAliveOrPending);
    const hordePct = isBossEncounter
      ? (currentBoss ? Math.max(0, 1 - currentBoss.hp / currentBoss.maxHp) : 1)
      : Math.max(0, Math.min(1, hordeKilled / Math.max(1, hordeTotal)));
    const xpX = lvlX + 65;
    const xpW = 150;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(xpX, hpY, xpW, hpH);
    ctx.fillStyle = isBossEncounter ? '#ef4444' : '#00f0ff';
    ctx.fillRect(xpX, hpY, xpW * hordePct, hpH);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(xpX, hpY, xpW, hpH);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(isBossEncounter ? `TITAN BOSS // LVL ${level}` : `HORDA ${hordeKilled}/${hordeTotal}`, xpX + 6, hpY + 13);

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

    // Mini Matrix Status & Aim Assist
    const stX = tx + 100;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText(`⚡x${projectileCount} ◎x${orbitalShieldCount}${droneCount > 0 ? ` ▲x${droneCount}` : ''}`, stX, hpY + 13);

    const aimBadgeX = stX + 90;
    ctx.font = '700 9px "JetBrains Mono", monospace';
    if (hasAimAssist) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('AIM: AUTO 360°', aimBadgeX, hpY + 13);
    } else {
      ctx.fillStyle = '#71717a';
      ctx.fillText('AIM: MANUAL', aimBadgeX, hpY + 13);
    }

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Header
    ctx.textAlign = 'center';
    if (isMegaUpgradeModal) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.fillText('// ★ MEGA PROTOCOLO DESBLOQUEADO // TITAN PURGED ★', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 160);

      ctx.fillStyle = '#fafafa';
      ctx.font = '600 14px "JetBrains Mono", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText('ESCOLHA 1 MEGA UPGRADE LENDÁRIO [1, 2, 3]', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 130);
    } else {
      ctx.fillStyle = '#fafafa';
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillText('// UPGRADE PROTOCOL DETECTED', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 160);

      ctx.fillStyle = '#71717a';
      ctx.font = '500 14px "JetBrains Mono", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText('SELECT MODULE [1, 2, 3] OR CLICK CARD', V_WIDTH * 0.5, V_HEIGHT * 0.5 - 130);
    }

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
      ctx.strokeStyle = isMegaUpgradeModal ? '#00f0ff' : '#27272a';
      ctx.lineWidth = isMegaUpgradeModal ? 2 : 1.5;
      if (isMegaUpgradeModal) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
      }
      ctx.strokeRect(rx, cardY, cardW, cardH);
      ctx.shadowBlur = 0;

      // Key Badge
      ctx.fillStyle = isMegaUpgradeModal ? '#00f0ff' : '#ffffff';
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
      ctx.fillStyle = isMegaUpgradeModal ? '#00f0ff' : '#fafafa';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      const titleLines = wrapText(ctx, opt.title, maxContentWidth);
      const titleLineHeight = 18;
      const titleStartY = titleLines.length > 1 ? cardY + 104 : cardY + 112;
      for (let t = 0; t < titleLines.length; t++) {
        ctx.fillText(titleLines[t], rx + cardW * 0.5, titleStartY + t * titleLineHeight);
      }

      // Install Button UI
      const btnY = cardY + cardH - 42;
      ctx.fillStyle = isMegaUpgradeModal ? 'rgba(0, 240, 255, 0.15)' : '#18181b';
      ctx.fillRect(rx + 25, btnY, cardW - 50, 28);
      ctx.strokeStyle = isMegaUpgradeModal ? '#00f0ff' : '#3f3f46';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 25, btnY, cardW - 50, 28);

      ctx.fillStyle = isMegaUpgradeModal ? '#00f0ff' : '#fafafa';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(isMegaUpgradeModal ? `EQUIPAR [${i + 1}]` : `INSTALL [${i + 1}]`, rx + cardW * 0.5, btnY + 18);

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
