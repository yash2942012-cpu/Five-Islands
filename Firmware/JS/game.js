(() => {
  'use strict';

  const Game = window.FiveIslands;
  if (!Game || !Game.THREE) return;
  const { THREE, state, player, definitions, camera, renderer, dom, keys } = Game;
  let dragLook = false;
  let hudTimer = 0;
  let wakeTimer = 0;
  let sailCameraTarget = new THREE.Vector3();

  Game.cameraShake = 0;

  Game.showToast = (message, duration = 3200) => {
    dom.toast.textContent = message;
    dom.toast.classList.add('visible');
    window.clearTimeout(Game.toastTimer);
    Game.toastTimer = window.setTimeout(() => dom.toast.classList.remove('visible'), duration);
  };

  Game.updateHud = () => {
    dom.healthFill.style.width = `${player.health}%`;
    dom.healthText.textContent = Math.ceil(player.health).toString();
    dom.timer.textContent = Game.formatTime(state.elapsed);
    dom.location.textContent = state.currentIsland >= 0 ? definitions[state.currentIsland].name : 'The Ancient Causeway';
    let objective;
    if (state.sailing) objective = 'The storm is behind you. The Five Seals are fading.';
    else if (state.hasKey) objective = 'Board the ship at the northern dock and set sail.';
    else if (state.bossDefeated) objective = 'Claim the captain’s key from the warden’s throne.';
    else if (state.bossActive) objective = 'Defeat the Tidewarden. Dodge its slam, then strike its heart.';
    else if (state.seals === 0) objective = 'Find the rune altar on Dawnwatch Cay and decode its inscription.';
    else if (state.seals < 4) objective = `Cross the causeway to ${definitions[state.seals].name}. Decode its rune altar.`;
    else objective = 'Enter Ashen Crown and challenge the silent warden.';
    dom.objective.textContent = objective;
    [...dom.sealList.children].forEach((seal, index) => {
      seal.classList.toggle('done', index < state.seals);
      seal.classList.toggle('current', !state.complete && (index === state.seals || (state.seals === 4 && index === 4)));
    });
    dom.bossHealthFill.style.width = `${Game.clamp(Game.entities.boss.health / Game.entities.boss.maxHealth, 0, 1) * 100}%`;
    dom.bossHealthText.textContent = `${Math.ceil(Game.entities.boss.health)} / ${Game.entities.boss.maxHealth}`;
  };

  function updateJournal() {
    dom.journalList.innerHTML = '';
    definitions.slice(0, 4).forEach((definition, index) => {
      const entry = document.createElement('div');
      entry.className = `journal-entry${state.journal[index] ? '' : ' locked'}`;
      const title = document.createElement('strong');
      title.textContent = definition.name;
      const text = document.createElement('p');
      text.textContent = state.journal[index] ? definition.clue : 'No inscription recovered yet.';
      entry.append(title, text);
      dom.journalList.appendChild(entry);
    });
  }

  function updateSequenceDisplay() {
    dom.sequenceDisplay.innerHTML = '';
    for (let index = 0; index < 4; index += 1) {
      const slot = document.createElement('span');
      if (state.puzzleInput[index]) slot.textContent = state.puzzleInput[index];
      else slot.className = 'empty';
      dom.sequenceDisplay.appendChild(slot);
    }
  }

  function clearPuzzleSelection() {
    state.puzzleInput = [];
    updateSequenceDisplay();
  }

  function requestPointerLock() {
    if (Game.isTouchDevice || state.complete || state.dead || state.puzzleOpen || state.journalOpen) return;
    if (!renderer.domElement.requestPointerLock) return;
    const request = renderer.domElement.requestPointerLock();
    if (request && typeof request.catch === 'function') request.catch(() => {});
  }

  function closeModal() {
    state.puzzleOpen = false;
    state.journalOpen = false;
    dom.puzzleModal.classList.add('hidden');
    dom.journalModal.classList.add('hidden');
    requestPointerLock();
  }

  Game.openPuzzle = (index) => {
    if (!state.started || state.complete || state.solved[index]) return;
    state.puzzleOpen = true;
    state.puzzleIndex = index;
    state.puzzleInput = [];
    const definition = definitions[index];
    dom.puzzleTitle.textContent = `${definition.name} inscription`;
    dom.clueText.textContent = definition.clue;
    dom.runeButtons.innerHTML = '';
    definition.marks.forEach((mark, markIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rune-button';
      const glyph = document.createElement('b');
      glyph.textContent = definition.glyphs[markIndex];
      const text = document.createElement('span');
      text.textContent = mark;
      button.append(glyph, text);
      button.addEventListener('click', () => choosePuzzleMark(mark));
      dom.runeButtons.appendChild(button);
    });
    updateSequenceDisplay();
    dom.puzzleModal.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  };

  function choosePuzzleMark(mark) {
    if (!state.puzzleOpen || state.puzzleInput.length >= 4) return;
    const definition = definitions[state.puzzleIndex];
    state.puzzleInput.push(mark);
    updateSequenceDisplay();
    Game.audio.tone(210 + state.puzzleInput.length * 48, 0.09, 'triangle', 0.045);
    const correct = state.puzzleInput.every((value, index) => value === definition.sequence[index]);
    if (state.puzzleInput.length < 4) return;
    if (correct) {
      const index = state.puzzleIndex;
      state.solved[index] = true;
      state.journal[index] = true;
      state.seals += 1;
      const station = Game.puzzleStations[index];
      station.solved = true;
      station.runeMaterial.color.set(0x79ffd0);
      station.runeMaterial.emissive.set(0x35ffc0);
      station.beam.material.opacity = 0.3;
      closeModal();
      updateJournal();
      Game.updateHud();
      Game.showToast(`The ${definitions[index].name} seal awakens. The next causeway answers.`, 4200);
      [392, 494, 587, 784].forEach((frequency, indexInTones) => window.setTimeout(() => Game.audio.tone(frequency, 0.24, 'sine', 0.055), indexInTones * 110));
      Game.burst(new THREE.Vector3(station.position.x, Game.GROUND_Y + 2, station.position.z), definitions[index].accent, 38);
    } else {
      dom.puzzleCard.classList.remove('shake');
      void dom.puzzleCard.offsetWidth;
      dom.puzzleCard.classList.add('shake');
      Game.showToast('The marks fade. Read the clue and try the order again.');
      Game.audio.tone(120, 0.28, 'sawtooth', 0.04);
      window.setTimeout(clearPuzzleSelection, 520);
    }
  }

  function openJournal() {
    if (!state.started || state.complete) return;
    state.journalOpen = true;
    updateJournal();
    dom.journalModal.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function nearestInteraction() {
    if (state.puzzleOpen || state.journalOpen || state.sailing || state.dead || state.complete) return null;
    let nearest = null;
    let nearestDistance = Infinity;
    Game.interactables.forEach((interactable) => {
      if (!interactable.enabled()) return;
      const distance = Math.hypot(player.position.x - interactable.position.x, player.position.z - interactable.position.z);
      if (distance <= interactable.radius && distance < nearestDistance) {
        nearest = interactable;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  function useInteraction() {
    if (state.puzzleOpen || state.journalOpen || !state.started) return;
    if (state.interaction) state.interaction.onInteract();
  }

  function attack() {
    if (!state.started || state.puzzleOpen || state.journalOpen || state.dead || state.complete || state.sailing || player.attackCooldown > 0) return;
    player.attackCooldown = 0.48;
    player.attackElapsed = 0;
    player.attackHit = false;
    Game.audio.tone(250, 0.08, 'triangle', 0.025);
  }

  Game.damagePlayer = (amount, knockbackX = 0, knockbackZ = 0) => {
    if (player.invulnerable > 0 || state.dead || state.complete || state.sailing) return;
    player.health = Math.max(0, player.health - amount);
    player.invulnerable = 0.38;
    const targetX = player.position.x + knockbackX;
    const targetZ = player.position.z + knockbackZ;
    if (Game.isWalkable(targetX, targetZ)) {
      player.position.x = targetX;
      player.position.z = targetZ;
    }
    dom.damageVignette.classList.add('hit');
    window.clearTimeout(Game.damageTimer);
    Game.damageTimer = window.setTimeout(() => dom.damageVignette.classList.remove('hit'), 120);
    Game.updateHud();
    Game.cameraShake = Math.max(Game.cameraShake, 0.18);
    Game.audio.tone(90, 0.16, 'sawtooth', 0.055);
    if (player.health <= 0) endGame(false);
  };

  function endGame(won) {
    if (state.complete || state.dead) return;
    if (won) {
      state.complete = true;
      dom.hud.classList.add('hidden');
      dom.finalTime.textContent = Game.formatTime(state.elapsed);
      dom.finalClues.textContent = `${state.seals} / 4`;
      dom.victoryScreen.classList.remove('hidden');
      dom.cinematicBars.classList.add('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
      Game.burst(new THREE.Vector3(Game.entities.ship.position.x, 7, Game.entities.ship.position.z), 0xffd46a, 100);
    } else {
      state.dead = true;
      dom.deathScreen.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
      Game.audio.tone(70, 0.7, 'sawtooth', 0.06);
    }
  }

  function startGame() {
    if (state.started) return;
    state.started = true;
    dom.intro.classList.add('hidden');
    dom.hud.classList.remove('hidden');
    if (Game.isTouchDevice) dom.mobileControls.classList.remove('hidden');
    Game.audio.initialize();
    Game.updateHud();
    Game.showToast('Find the rune altar on Dawnwatch Cay. Press E when you are close.', 4800);
    requestPointerLock();
  }

  Game.beginSailing = () => {
    if (!state.hasKey || state.sailing) return;
    state.sailing = true;
    state.sailStartedAt = performance.now();
    dom.interaction.classList.add('hidden');
    dom.hud.classList.add('hidden');
    dom.cinematicBars.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    Game.showToast('The key turns. The ancient sail catches the wind.', 5000);
    [262, 330, 392, 523].forEach((frequency, index) => window.setTimeout(() => Game.audio.tone(frequency, 0.42, 'sine', 0.05), index * 180));
  };

  function updateSailing(now) {
    const progress = Game.clamp((now - state.sailStartedAt) / 9000, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 2);
    const ship = Game.entities.ship;
    ship.position.x = Math.sin(progress * Math.PI) * 38;
    ship.position.z = ship.userData.startZ + eased * 150;
    ship.position.y = 0.08 + Game.tide * 0.4 + Math.sin(now * 0.003) * 0.18;
    ship.rotation.y = -Math.sin(progress * Math.PI) * 0.55;
    const sailScale = Math.min(1, progress * 4);
    const flagScale = Math.min(1, Math.max(0, (progress - 0.08) * 5));
    ship.userData.sail.scale.setScalar(sailScale);
    ship.userData.flag.scale.setScalar(flagScale);
    sailCameraTarget.set(ship.position.x + 22, 11.5, ship.position.z - 30);
    camera.position.x = Game.damp(camera.position.x, sailCameraTarget.x, 1.2, 0.016);
    camera.position.y = Game.damp(camera.position.y, sailCameraTarget.y, 1.2, 0.016);
    camera.position.z = Game.damp(camera.position.z, sailCameraTarget.z, 1.2, 0.016);
    camera.lookAt(ship.position.x, ship.position.y + 4, ship.position.z);
    wakeTimer -= 0.016;
    if (wakeTimer <= 0) {
      wakeTimer = 0.18;
      Game.burst(new THREE.Vector3(ship.position.x, 0.4, ship.position.z - 5.5), 0xbceff2, 12);
    }
    if (progress >= 1) endGame(true);
  }

  function updateWater(elapsed) {
    const positions = Game.waterPositions;
    const amplitude = 0.72 + Game.tide * 0.4;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      positions.setY(index, (Math.sin(x * 0.065 + elapsed * 0.82) * 0.18 + Math.cos(z * 0.09 - elapsed * 0.62) * 0.12 + Math.sin((x + z) * 0.037 + elapsed * 0.45) * 0.1) * amplitude);
    }
    positions.needsUpdate = true;
    if (Game.frameCount % 4 === 0) Game.water.geometry.computeVertexNormals();
  }

  function updatePlayer(delta) {
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    player.attackCooldown = Math.max(0, player.attackCooldown - delta);
    player.attackElapsed += delta;
    if (player.attackElapsed >= 0.16 && player.attackElapsed < 0.36 && !player.attackHit) Game.resolvePlayerAttack();
    let inputX = 0;
    let inputZ = 0;
    if (keys.KeyW || keys.ArrowUp) inputZ += 1;
    if (keys.KeyS || keys.ArrowDown) inputZ -= 1;
    if (keys.KeyA || keys.ArrowLeft) inputX -= 1;
    if (keys.KeyD || keys.ArrowRight) inputX += 1;
    inputX += Game.mobileMove.x;
    inputZ += -Game.mobileMove.y;
    const inputLength = Math.hypot(inputX, inputZ);
    if (inputLength > 1) {
      inputX /= inputLength;
      inputZ /= inputLength;
    }
    player.sprinting = Boolean((keys.ShiftLeft || keys.ShiftRight) && inputZ > 0.2);
    const speed = player.sprinting ? 9.3 : 6.1;
    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);
    const moveX = (rightX * inputX + forwardX * inputZ) * speed * delta;
    const moveZ = (rightX * 0 + rightZ * inputX + forwardZ * inputZ) * speed * delta;
    const nextX = player.position.x + moveX;
    const nextZ = player.position.z + moveZ;
    const previousX = player.position.x;
    const previousZ = player.position.z;
    if (Game.isWalkable(nextX, previousZ)) player.position.x = nextX;
    if (Game.isWalkable(player.position.x, nextZ)) player.position.z = nextZ;
    player.moving = inputLength > 0.08 && (Math.abs(player.position.x - previousX) > 0.0001 || Math.abs(player.position.z - previousZ) > 0.0001);
    if (keys.Space && player.velocityY === 0 && player.position.y <= Game.GROUND_Y + 0.01) {
      player.velocityY = 7.2;
      keys.Space = false;
      Game.audio.tone(120, 0.08, 'triangle', 0.018);
    }
    player.velocityY -= 19 * delta;
    player.position.y += player.velocityY * delta;
    if (player.position.y < Game.GROUND_Y) {
      if (player.velocityY < -4) Game.audio.tone(95, 0.05, 'triangle', 0.012);
      player.position.y = Game.GROUND_Y;
      player.velocityY = 0;
    }
    if (player.moving) {
      player.bobTime += delta * (player.sprinting ? 13 : 9.5);
      player.footstepTime -= delta;
      if (player.footstepTime <= 0) {
        Game.audio.tone(70 + Math.random() * 18, 0.045, 'triangle', 0.012);
        player.footstepTime = player.sprinting ? 0.28 : 0.4;
      }
    } else {
      player.bobTime = Game.damp(player.bobTime, 0, 7, delta);
    }
    const bobAmount = player.moving ? Math.sin(player.bobTime) * (player.sprinting ? 0.075 : 0.045) : 0;
    const bobSide = player.moving ? Math.cos(player.bobTime * 0.5) * 0.022 : 0;
    camera.position.set(player.position.x + rightX * bobSide, player.position.y + Game.PLAYER_HEIGHT + bobAmount, player.position.z + rightZ * bobSide);
    Game.cameraShake = Math.max(0, Game.cameraShake - delta);
    if (Game.cameraShake > 0) {
      camera.position.x += (Math.random() - 0.5) * Game.cameraShake;
      camera.position.y += (Math.random() - 0.5) * Game.cameraShake * 0.6;
      camera.position.z += (Math.random() - 0.5) * Game.cameraShake;
    }
    camera.rotation.set(player.pitch, player.yaw, 0);
  }

  function updateProgress() {
    const island = Game.currentIslandAt(player.position.x, player.position.z);
    if (island !== state.currentIsland) {
      state.currentIsland = island;
      if (island >= 0 && state.started) Game.showToast(definitions[island].name, 2200);
    }
    if (island === 4 && state.seals === 4 && !state.bossActive && !state.bossDefeated) {
      const boss = Game.entities.boss;
      if (Math.hypot(player.position.x - boss.position.x, player.position.z - boss.position.z) < 12.5) Game.activateBoss();
    }
    if (island === 4 && state.seals < 4 && !state.bossActive && !state.bossDefeated) {
      const boss = Game.entities.boss;
      if (Math.hypot(player.position.x - boss.position.x, player.position.z - boss.position.z) < 8) Game.showToast('The Tidewarden is bound by four sleeping seals.', 3000);
    }
  }

  function updateInteractionPrompt() {
    state.interaction = nearestInteraction();
    if (state.interaction) {
      dom.interaction.querySelector('span').textContent = state.interaction.label();
      dom.interaction.classList.remove('hidden');
      dom.crosshair.classList.add('active');
    } else {
      dom.interaction.classList.add('hidden');
      dom.crosshair.classList.remove('active');
    }
  }

  function setupUi() {
    definitions.forEach((definition, index) => {
      const seal = document.createElement('span');
      seal.className = 'seal';
      seal.textContent = index < 4 ? String(index + 1) : 'V';
      seal.title = definition.name;
      dom.sealList.appendChild(seal);
    });
    dom.startButton.disabled = false;
    dom.startButton.querySelector('span').textContent = 'Begin the escape';
    dom.startButton.addEventListener('click', startGame);
    dom.soundButton.addEventListener('click', () => Game.audio.toggle());
    dom.resetSequence.addEventListener('click', clearPuzzleSelection);
    dom.closePuzzle.addEventListener('click', closeModal);
    dom.closeJournal.addEventListener('click', closeModal);
    dom.retryButton.addEventListener('click', () => window.location.reload());
    dom.playAgain.addEventListener('click', () => window.location.reload());
  }

  function setupKeyboard() {
    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      keys[event.code] = true;
      if (event.code === 'KeyM') Game.audio.toggle();
      if (!state.started || event.repeat) return;
      if (event.code === 'KeyE') useInteraction();
      if (event.code === 'KeyF') attack();
      if (event.code === 'KeyJ') {
        if (state.journalOpen) closeModal();
        else openJournal();
      }
      if (event.code === 'Escape' && (state.puzzleOpen || state.journalOpen)) closeModal();
    });
    window.addEventListener('keyup', (event) => {
      keys[event.code] = false;
    });
    window.addEventListener('blur', () => {
      Object.keys(keys).forEach((key) => { keys[key] = false; });
    });
  }

  function setupMouse() {
    renderer.domElement.addEventListener('mousedown', (event) => {
      if (!state.started || state.puzzleOpen || state.journalOpen || state.dead || state.complete) return;
      if (event.button === 0) {
        if (document.pointerLockElement === renderer.domElement) attack();
        else requestPointerLock();
      }
      if (event.button === 2) dragLook = true;
    });
    window.addEventListener('mouseup', (event) => {
      if (event.button === 2) dragLook = false;
    });
    window.addEventListener('mousemove', (event) => {
      if (!state.started || state.puzzleOpen || state.journalOpen || state.sailing) return;
      if (document.pointerLockElement !== renderer.domElement && !dragLook) return;
      player.yaw -= event.movementX * 0.0022;
      player.pitch = Game.clamp(player.pitch - event.movementY * 0.0022, -1.35, 1.35);
    });
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement) dragLook = false;
    });
  }

  function setupTouch() {
    let joystickPointer = null;
    dom.joystick.addEventListener('pointerdown', (event) => {
      joystickPointer = event.pointerId;
      dom.joystick.setPointerCapture(event.pointerId);
    });
    dom.joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== joystickPointer) return;
      const bounds = dom.joystick.getBoundingClientRect();
      let x = event.clientX - (bounds.left + bounds.width / 2);
      let y = event.clientY - (bounds.top + bounds.height / 2);
      const length = Math.hypot(x, y);
      const max = 42;
      if (length > max) {
        x = x / length * max;
        y = y / length * max;
      }
      Game.mobileMove.set(x / max, y / max);
      dom.joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
    });
    const resetJoystick = (event) => {
      if (event.pointerId !== joystickPointer) return;
      joystickPointer = null;
      Game.mobileMove.set(0, 0);
      dom.joystickKnob.style.transform = '';
    };
    dom.joystick.addEventListener('pointerup', resetJoystick);
    dom.joystick.addEventListener('pointercancel', resetJoystick);
    dom.lookZone.addEventListener('pointerdown', (event) => {
      Game.touch.lookId = event.pointerId;
      Game.touch.x = event.clientX;
      Game.touch.y = event.clientY;
      dom.lookZone.setPointerCapture(event.pointerId);
    });
    dom.lookZone.addEventListener('pointermove', (event) => {
      if (event.pointerId !== Game.touch.lookId) return;
      player.yaw -= (event.clientX - Game.touch.x) * 0.006;
      player.pitch = Game.clamp(player.pitch - (event.clientY - Game.touch.y) * 0.006, -1.35, 1.35);
      Game.touch.x = event.clientX;
      Game.touch.y = event.clientY;
    });
    const releaseLook = (event) => {
      if (event.pointerId === Game.touch.lookId) Game.touch.lookId = null;
    };
    dom.lookZone.addEventListener('pointerup', releaseLook);
    dom.lookZone.addEventListener('pointercancel', releaseLook);
    dom.mobileAction.addEventListener('pointerdown', (event) => { event.preventDefault(); useInteraction(); });
    dom.mobileAttack.addEventListener('pointerdown', (event) => { event.preventDefault(); attack(); });
    dom.mobileJump.addEventListener('pointerdown', (event) => { event.preventDefault(); keys.Space = true; });
  }

  function setupResize() {
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(Game.clock.getDelta(), 0.05);
    const elapsed = Game.clock.elapsedTime;
    Game.frameCount += 1;
    if (state.started) state.elapsed += delta;
    if (!state.started) {
      camera.position.set(96 + Math.sin(elapsed * 0.08) * 10, 66, 250);
      camera.lookAt(78, 0, 52);
    } else if (state.sailing) {
      updateSailing(performance.now());
    } else if (!state.dead && !state.complete) {
      updatePlayer(delta);
      updateProgress();
      updateInteractionPrompt();
    }
    if (state.started) Game.updateEntities(delta, elapsed);
    Game.updateAtmosphere(delta, elapsed);
    updateWater(elapsed);
    hudTimer -= delta;
    if (hudTimer <= 0) {
      Game.updateHud();
      hudTimer = 0.1;
    }
    renderer.render(Game.scene, camera);
  }

  Game.createWorld();
  Game.createEntities();
  setupUi();
  setupKeyboard();
  setupMouse();
  setupTouch();
  setupResize();
  camera.position.set(96, 66, 250);
  camera.lookAt(78, 0, 52);
  animate();
})();
