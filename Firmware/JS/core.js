(() => {
  'use strict';

  const Game = window.FiveIslands = {};
  const THREE = window.THREE;
  Game.THREE = THREE;

  if (!THREE) {
    const button = document.getElementById('start-button');
    button.querySelector('span').textContent = 'Unable to load the 3D engine';
    return;
  }

  Game.dom = {
    game: document.getElementById('game'),
    startButton: document.getElementById('start-button'),
    soundButton: document.getElementById('sound-button'),
    intro: document.getElementById('intro'),
    hud: document.getElementById('hud'),
    location: document.getElementById('location'),
    timer: document.getElementById('timer'),
    objective: document.getElementById('objective'),
    healthFill: document.getElementById('health-fill'),
    healthText: document.getElementById('health-text'),
    sealList: document.getElementById('seal-list'),
    bossHud: document.getElementById('boss-hud'),
    bossHealthFill: document.getElementById('boss-health-fill'),
    bossHealthText: document.getElementById('boss-health-text'),
    crosshair: document.getElementById('crosshair'),
    interaction: document.getElementById('interaction'),
    toast: document.getElementById('toast'),
    damageVignette: document.getElementById('damage-vignette'),
    puzzleModal: document.getElementById('puzzle-modal'),
    puzzleCard: document.getElementById('puzzle-card'),
    puzzleTitle: document.getElementById('puzzle-title'),
    clueText: document.getElementById('clue-text'),
    sequenceDisplay: document.getElementById('sequence-display'),
    runeButtons: document.getElementById('rune-buttons'),
    resetSequence: document.getElementById('reset-sequence'),
    closePuzzle: document.getElementById('close-puzzle'),
    journalModal: document.getElementById('journal-modal'),
    journalList: document.getElementById('journal-list'),
    closeJournal: document.getElementById('close-journal'),
    deathScreen: document.getElementById('death-screen'),
    retryButton: document.getElementById('retry-button'),
    victoryScreen: document.getElementById('victory-screen'),
    finalTime: document.getElementById('final-time'),
    finalClues: document.getElementById('final-clues'),
    playAgain: document.getElementById('play-again'),
    cinematicBars: document.getElementById('cinematic-bars'),
    mobileControls: document.getElementById('mobile-controls'),
    lookZone: document.getElementById('look-zone'),
    joystick: document.getElementById('joystick'),
    joystickKnob: document.querySelector('#joystick i'),
    mobileAction: document.getElementById('mobile-action'),
    mobileAttack: document.getElementById('mobile-attack'),
    mobileJump: document.getElementById('mobile-jump')
  };

  Game.TAU = Math.PI * 2;
  Game.GROUND_Y = 1.65;
  Game.PLAYER_HEIGHT = 1.72;
  Game.clamp = THREE.MathUtils.clamp;
  Game.definitions = [
    {
      name: 'Dawnwatch Cay',
      color: 0x5baa6d,
      sand: 0xe9c979,
      accent: 0xffd36d,
      center: new THREE.Vector2(0, 0),
      radius: 34,
      theme: 'shore',
      clue: 'First the gold of morning, then the blue beneath it. Next the violet crown, and last the white eye that watches from forever.',
      marks: ['TIDE', 'STAR', 'SUN', 'CROWN'],
      glyphs: ['I', 'II', 'III', 'IV'],
      sequence: ['SUN', 'TIDE', 'CROWN', 'STAR']
    },
    {
      name: 'Coral Vault',
      color: 0x4d9b87,
      sand: 0xd9c693,
      accent: 0x74ffe0,
      center: new THREE.Vector2(96, -20),
      radius: 32,
      theme: 'coral',
      clue: 'The hungry serpent devours. The guarded shell shelters. The wandering current follows. Last, the quiet heart keeps them all.',
      marks: ['HEART', 'SERPENT', 'SHELL', 'CURRENT'],
      glyphs: ['I', 'II', 'III', 'IV'],
      sequence: ['SERPENT', 'SHELL', 'CURRENT', 'HEART']
    },
    {
      name: 'Emerald Reach',
      color: 0x3d7d4f,
      sand: 0xc6b56f,
      accent: 0xa8ff86,
      center: new THREE.Vector2(180, 34),
      radius: 34,
      theme: 'jungle',
      clue: 'Root drinks first. Rain clouds the second. Leaf trembles after thunder, while the flower closes the riddle at the end.',
      marks: ['LEAF', 'FLOWER', 'ROOT', 'RAIN'],
      glyphs: ['I', 'II', 'III', 'IV'],
      sequence: ['ROOT', 'RAIN', 'LEAF', 'FLOWER']
    },
    {
      name: 'Moonwell Ruins',
      color: 0x576d83,
      sand: 0xc3c6b8,
      accent: 0xc6c6ff,
      center: new THREE.Vector2(120, 134),
      radius: 32,
      theme: 'moon',
      clue: 'Moth seeks the bloom. Bloom waits for dew. Dew belongs to night, and only after night does the dream return to sleep.',
      marks: ['DREAM', 'MOTH', 'DEW', 'BLOOM'],
      glyphs: ['I', 'II', 'III', 'IV'],
      sequence: ['MOTH', 'BLOOM', 'DEW', 'DREAM']
    },
    {
      name: 'Ashen Crown',
      color: 0x4b4652,
      sand: 0x827b75,
      accent: 0xff6b55,
      center: new THREE.Vector2(0, 112),
      radius: 36,
      theme: 'ash',
      clue: 'Four seals wake the warden. Its heart is the fifth.',
      marks: [],
      glyphs: [],
      sequence: []
    }
  ];

  Game.state = {
    started: false,
    complete: false,
    dead: false,
    sailing: false,
    currentIsland: 0,
    seals: 0,
    solved: [false, false, false, false],
    journal: [false, false, false, false],
    hasKey: false,
    bossActive: false,
    bossDefeated: false,
    puzzleOpen: false,
    puzzleIndex: 0,
    puzzleInput: [],
    journalOpen: false,
    muted: false,
    elapsed: 0,
    interaction: null,
    sailStartedAt: 0
  };

  Game.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  Game.renderer.setSize(window.innerWidth, window.innerHeight);
  Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  Game.renderer.shadowMap.enabled = true;
  Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  Game.renderer.outputEncoding = THREE.sRGBEncoding;
  Game.dom.game.appendChild(Game.renderer.domElement);

  Game.scene = new THREE.Scene();
  Game.scene.background = new THREE.Color(0x071c29);
  Game.scene.fog = new THREE.FogExp2(0x0a3440, 0.0042);

  Game.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.08, 800);
  Game.camera.rotation.order = 'YXZ';
  Game.scene.add(Game.camera);

  Game.clock = new THREE.Clock();
  Game.keys = Object.create(null);
  Game.mobileMove = new THREE.Vector2();
  Game.touch = { lookId: null, x: 0, y: 0 };
  Game.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  Game.interactables = [];
  Game.puzzleStations = [];
  Game.healables = [];
  Game.bridges = [];
  Game.particles = [];
  Game.flames = [];
  Game.dock = { startZ: Game.definitions[4].center.y + 27, endZ: Game.definitions[4].center.y + 48, halfWidth: 2.8 };
  Game.toastTimer = 0;
  Game.damageTimer = 0;
  Game.frameCount = 0;
  Game.water = null;
  Game.waterPositions = null;
  Game.tide = 0;
  Game.sky = {
    time: 0.07,
    cycle: 300,
    clouds: [],
    birds: [],
    buoys: [],
    boats: [],
    foam: [],
    fireflies: null,
    fireflyBase: null,
    stars: null,
    starsMaterial: null,
    skyMaterial: null,
    sun: null,
    moon: null,
    sunGlow: null,
    moonGlow: null,
    sunlight: null,
    hemi: null,
    violet: null,
    waterMaterial: null,
    foamMaterial: null
  };

  Game.player = {
    position: new THREE.Vector3(0, Game.GROUND_Y, 8),
    velocityY: 0,
    yaw: -Math.PI / 2,
    pitch: -0.08,
    health: 100,
    invulnerable: 0,
    attackCooldown: 0,
    attackElapsed: 10,
    attackHit: false,
    moving: false,
    sprinting: false,
    bobTime: 0,
    footstepTime: 0
  };

  Game.materials = {
    wood: new THREE.MeshStandardMaterial({ color: 0x765038, roughness: 0.92 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x332a28, roughness: 0.9 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x6b5940, roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x5c6262, roughness: 0.95 }),
    paleStone: new THREE.MeshStandardMaterial({ color: 0xa9aaa1, roughness: 0.88 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x3c4d55, metalness: 0.72, roughness: 0.34 }),
    sail: new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.86, side: THREE.DoubleSide }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f704b, roughness: 0.9 }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x4d9956, roughness: 0.9 })
  };

  Game.seededRandom = (seed) => {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  };

  Game.damp = (current, target, smoothing, delta) => current + (target - current) * (1 - Math.exp(-smoothing * delta));

  Game.distanceToSegment = (px, pz, start, end) => {
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection = lengthSquared === 0 ? 0 : Game.clamp(((px - start.x) * segmentX + (pz - start.y) * segmentY) / lengthSquared, 0, 1);
    return Math.hypot(px - (start.x + segmentX * projection), pz - (start.y + segmentY * projection));
  };

  Game.isWalkable = (x, z) => {
    for (let index = 0; index < Game.definitions.length; index += 1) {
      const definition = Game.definitions[index];
      if (Math.hypot(x - definition.center.x, z - definition.center.y) <= definition.radius - 0.7) return true;
    }
    for (let index = 0; index < Game.bridges.length; index += 1) {
      const bridge = Game.bridges[index];
      if (Game.distanceToSegment(x, z, bridge.start, bridge.end) <= bridge.halfWidth) return true;
    }
    return Math.abs(x) <= Game.dock.halfWidth && z >= Game.dock.startZ && z <= Game.dock.endZ;
  };

  Game.currentIslandAt = (x, z) => {
    let closest = -1;
    let closestDistance = Infinity;
    Game.definitions.forEach((definition, index) => {
      const distance = Math.hypot(x - definition.center.x, z - definition.center.y);
      if (distance < definition.radius + 1 && distance < closestDistance) {
        closest = index;
        closestDistance = distance;
      }
    });
    return closest;
  };

  Game.formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remaining}`;
  };

  Game.audio = {
    context: null,
    oceanGain: null,
    bossGain: null,
    initialize() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume();
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
      const channel = buffer.getChannelData(0);
      let previous = 0;
      for (let index = 0; index < channel.length; index += 1) {
        const white = Math.random() * 2 - 1;
        previous = previous * 0.985 + white * 0.015;
        channel[index] = previous * 3.5;
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      this.oceanGain = this.context.createGain();
      this.oceanGain.gain.value = Game.state.muted ? 0 : 0.055;
      source.connect(filter).connect(this.oceanGain).connect(this.context.destination);
      source.start();
    },
    tone(frequency, duration, type = 'sine', volume = 0.04, delay = 0) {
      if (!this.context || Game.state.muted) return;
      const start = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    },
    startBoss() {
      if (!this.context || this.bossGain) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 47;
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      gain.gain.value = Game.state.muted ? 0 : 0.025;
      oscillator.connect(filter).connect(gain).connect(this.context.destination);
      oscillator.start();
      this.bossGain = gain;
    },
    toggle() {
      Game.state.muted = !Game.state.muted;
      Game.dom.soundButton.textContent = `Sound: ${Game.state.muted ? 'off' : 'on'}`;
      if (!this.context) return;
      if (this.oceanGain) this.oceanGain.gain.setTargetAtTime(Game.state.muted ? 0 : 0.055, this.context.currentTime, 0.05);
      if (this.bossGain) this.bossGain.gain.setTargetAtTime(Game.state.muted || !Game.state.bossActive ? 0 : 0.025, this.context.currentTime, 0.05);
    }
  };
})();
