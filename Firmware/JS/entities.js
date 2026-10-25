(() => {
  'use strict';

  const Game = window.FiveIslands;
  if (!Game || !Game.THREE) return;
  const THREE = Game.THREE;
  const { scene, camera, definitions, materials, GROUND_Y } = Game;

  function triangleGeometry(points) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  function createShip() {
    const ship = new THREE.Group();
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2f27, roughness: 0.82 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xc79a55, metalness: 0.35, roughness: 0.55 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.55, 9.2), hullMaterial);
    hull.position.y = 0.75;
    hull.castShadow = true;
    ship.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(2.9, 4.3, 4), hullMaterial);
    bow.position.set(0, 0.75, 5.45);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.z = Math.PI / 4;
    bow.scale.x = 0.95;
    bow.castShadow = true;
    ship.add(bow);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.25, 8.5), materials.darkWood);
    deck.position.y = 1.6;
    ship.add(deck);
    [-2.45, 2.45].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 7.8), trimMaterial);
      rail.position.set(x, 2, -0.4);
      ship.add(rail);
    });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 8.5, 8), materials.wood);
    mast.position.set(0, 5.1, -0.4);
    mast.castShadow = true;
    ship.add(mast);
    const sail = new THREE.Mesh(triangleGeometry([0, 8.8, -0.4, 0, 2.2, -0.4, 0, 2.2, 0.1]), materials.sail);
    sail.scale.setScalar(0.01);
    sail.position.x = 0.12;
    ship.add(sail);
    const flag = new THREE.Mesh(triangleGeometry([0, 0, 0, 2.3, -0.55, 0, 0, -1.1, 0]), new THREE.MeshStandardMaterial({ color: 0x58d8cb, side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(0.1, 9.1, -0.4);
    flag.scale.setScalar(0.01);
    ship.add(flag);
    ship.position.set(0, 0.08, Game.dock.endZ + 5.5);
    ship.rotation.y = 0;
    ship.userData.sail = sail;
    ship.userData.flag = flag;
    ship.userData.startZ = ship.position.z;
    scene.add(ship);
    return ship;
  }

  function createSword() {
    const sword = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.38, 8), materials.darkWood);
    handle.rotation.x = Math.PI / 2;
    sword.add(handle);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.1), new THREE.MeshStandardMaterial({ color: 0xc79a55, metalness: 0.65, roughness: 0.3 }));
    guard.position.z = -0.2;
    sword.add(guard);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.95, 4), new THREE.MeshStandardMaterial({ color: 0xd6f5f0, metalness: 0.72, roughness: 0.2 }));
    blade.rotation.x = -Math.PI / 2;
    blade.rotation.y = Math.PI / 4;
    blade.position.z = -0.72;
    blade.scale.z = 0.28;
    sword.add(blade);
    sword.position.set(0.52, -0.46, -0.72);
    sword.rotation.set(-0.18, -0.3, -0.12);
    sword.scale.setScalar(0.75);
    sword.traverse((child) => {
      if (child.isMesh) {
        child.renderOrder = 10;
        child.material.depthTest = false;
      }
    });
    camera.add(sword);
    return sword;
  }

  function createBoss() {
    const group = new THREE.Group();
    const dormantMaterial = new THREE.MeshStandardMaterial({ color: 0x31323b, roughness: 0.92 });
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x223b46, roughness: 0.55, metalness: 0.48 });
    const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x6d3942, roughness: 0.42, metalness: 0.58 });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 1), bodyMaterial);
    body.position.y = 4.3;
    body.scale.set(1.15, 1.28, 0.9);
    body.castShadow = true;
    group.add(body);
    const chest = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), armorMaterial);
    chest.position.set(0, 4.45, -2.1);
    chest.rotation.x = Math.PI / 2;
    group.add(chest);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(1.38, 0), armorMaterial);
    head.position.y = 7.1;
    head.castShadow = true;
    group.add(head);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff5d3f });
    [-0.52, 0.52].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), eyeMaterial);
      eye.position.set(x, 7.28, -1.22);
      group.add(eye);
    });
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0xb7a986, roughness: 0.65 });
    [-0.9, 0.9].forEach((x) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.8, 6), hornMaterial);
      horn.position.set(x, 9, 0.1);
      horn.rotation.z = x * -0.42;
      group.add(horn);
    });
    const armGeometry = new THREE.CylinderGeometry(0.5, 0.72, 4.1, 7);
    [-3.2, 3.2].forEach((x) => {
      const arm = new THREE.Mesh(armGeometry, bodyMaterial);
      arm.position.set(x, 4.4, 0);
      arm.rotation.z = x * -0.18;
      arm.castShadow = true;
      group.add(arm);
    });
    const legs = [];
    [-1.2, 1.2].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.05, 3.3, 7), dormantMaterial);
      leg.position.set(x, 1.5, 0);
      leg.castShadow = true;
      group.add(leg);
      legs.push(leg);
    });
    const trident = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), materials.metal);
    shaft.position.y = 1.5;
    trident.add(shaft);
    [-1, 0, 1].forEach((index) => {
      const tine = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.7, 5), materials.metal);
      tine.position.set(index * 0.42, 4.4, 0);
      trident.add(tine);
    });
    trident.position.set(3.65, 1.2, -0.3);
    trident.rotation.z = -0.22;
    group.add(trident);
    group.position.set(0, GROUND_Y, definitions[4].center.y);
    group.scale.setScalar(0.92);
    group.rotation.y = Math.PI;
    scene.add(group);
    const shockMaterial = new THREE.MeshBasicMaterial({ color: 0xff563d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const shockRing = new THREE.Mesh(new THREE.RingGeometry(1, 15, 64), shockMaterial);
    shockRing.rotation.x = -Math.PI / 2;
    shockRing.position.set(0, GROUND_Y + 0.07, definitions[4].center.y);
    shockRing.visible = false;
    scene.add(shockRing);
    return {
      group,
      body,
      head,
      chest,
      legs,
      trident,
      bodyMaterial,
      armorMaterial,
      dormantMaterial,
      eyeMaterial,
      position: group.position,
      health: 120,
      maxHealth: 120,
      active: false,
      enraged: false,
      hitFlash: 0,
      action: null,
      attackCooldown: 1.2,
      slamCooldown: 3.5,
      stagger: 0,
      shockRing,
      shockMaterial
    };
  }

  function createKey() {
    const pedestal = new THREE.Group();
    pedestal.position.set(0, GROUND_Y, definitions[4].center.y + 14);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 0.8, 8), materials.paleStone);
    base.position.y = 0.4;
    base.castShadow = true;
    pedestal.add(base);
    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd86c, emissive: 0xffa62e, emissiveIntensity: 0.72, metalness: 0.7, roughness: 0.24 });
    const keyGroup = new THREE.Group();
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 8, 18), keyMaterial);
    bow.position.y = 1.8;
    keyGroup.add(bow);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8), keyMaterial);
    stem.position.y = 0.95;
    keyGroup.add(stem);
    const toothA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.12), keyMaterial);
    toothA.position.set(0.17, 0.55, 0);
    keyGroup.add(toothA);
    const toothB = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.12), keyMaterial);
    toothB.position.set(0.11, 0.92, 0);
    keyGroup.add(toothB);
    const light = new THREE.PointLight(0xffc85a, 1.2, 8, 2);
    light.position.y = 1.5;
    keyGroup.add(light);
    keyGroup.position.y = 0.8;
    pedestal.add(keyGroup);
    pedestal.visible = false;
    scene.add(pedestal);
    return { pedestal, keyGroup, keyMaterial };
  }

  function burst(position, color, count) {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const random = Game.seededRandom(Math.floor(position.x * 97 + position.z * 31 + count));
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = position.x;
      positions[index * 3 + 1] = position.y;
      positions[index * 3 + 2] = position.z;
      const angle = random() * Game.TAU;
      const speed = 2 + random() * 8;
      velocities.push(new THREE.Vector3(Math.cos(angle) * speed, 2 + random() * 9, Math.sin(angle) * speed));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size: 0.26, transparent: true, opacity: 0.95, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    Game.particles.push({ points, velocities, age: 0, life: 1.5 + random() * 0.8 });
  }

  function updateParticles(delta) {
    for (let index = Game.particles.length - 1; index >= 0; index -= 1) {
      const particle = Game.particles[index];
      particle.age += delta;
      const positions = particle.points.geometry.attributes.position;
      for (let pointIndex = 0; pointIndex < particle.velocities.length; pointIndex += 1) {
        const velocity = particle.velocities[pointIndex];
        velocity.y -= 9.8 * delta;
        positions.array[pointIndex * 3] += velocity.x * delta;
        positions.array[pointIndex * 3 + 1] += velocity.y * delta;
        positions.array[pointIndex * 3 + 2] += velocity.z * delta;
      }
      positions.needsUpdate = true;
      particle.points.material.opacity = Math.max(0, 1 - particle.age / particle.life);
      if (particle.age >= particle.life) {
        scene.remove(particle.points);
        particle.points.geometry.dispose();
        particle.points.material.dispose();
        Game.particles.splice(index, 1);
      }
    }
  }

  function activateBoss() {
    if (Game.state.bossActive || Game.state.bossDefeated) return;
    Game.state.bossActive = true;
    entities.boss.active = true;
    entities.boss.bodyMaterial.color.set(0x284b58);
    entities.boss.bodyMaterial.emissive.set(0x082b33);
    entities.boss.bodyMaterial.emissiveIntensity = 0.38;
    entities.boss.armorMaterial.color.set(0x8c3d42);
    entities.boss.dormantMaterial.color.set(0x3b4d55);
    entities.boss.attackCooldown = 1.5;
    entities.boss.slamCooldown = 2.6;
    Game.dom.bossHud.classList.remove('hidden');
    Game.showToast('THE TIDEWARDEN awakens. Strike its heart, but never stand inside the red ring.', 5200);
    burst(entities.boss.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xff563d, 60);
    Game.audio.tone(48, 1.2, 'sawtooth', 0.07);
    Game.audio.tone(71, 1, 'square', 0.035, 0.2);
    Game.audio.startBoss();
    Game.updateHud();
  }

  function beginBossAction(type) {
    const boss = entities.boss;
    if (boss.action) return;
    if (type === 'slam') {
      boss.action = { type, elapsed: 0, duration: 1.15, hit: false };
      boss.shockRing.position.x = boss.position.x;
      boss.shockRing.position.z = boss.position.z;
      boss.shockRing.visible = true;
      boss.shockMaterial.opacity = 0.85;
      boss.shockRing.scale.setScalar(0.12);
      Game.audio.tone(72, 0.55, 'sawtooth', 0.055);
    } else {
      boss.action = { type, elapsed: 0, duration: 0.78, hit: false };
      Game.audio.tone(115, 0.24, 'square', 0.04);
    }
  }

  function damageBoss(amount) {
    const boss = entities.boss;
    if (!boss.active || Game.state.bossDefeated) return;
    boss.health = Math.max(0, boss.health - (boss.enraged ? amount * 0.84 : amount));
    boss.hitFlash = 0.16;
    boss.stagger = boss.enraged ? 0.08 : 0.18;
    Game.updateHud();
    Game.audio.tone(155 + (boss.maxHealth - boss.health) * 1.1, 0.11, 'square', 0.05);
    if (boss.health <= 0) defeatBoss();
    else if (boss.health <= boss.maxHealth * 0.5 && !boss.enraged) {
      boss.enraged = true;
      boss.bodyMaterial.color.set(0x542b39);
      boss.armorMaterial.color.set(0xff684d);
      Game.showToast('The Tidewarden is enraged. Its slams now strike faster.', 3800);
      burst(boss.position.clone().add(new THREE.Vector3(0, 3, 0)), 0xff3b2f, 42);
    }
  }

  function defeatBoss() {
    const boss = entities.boss;
    Game.state.bossDefeated = true;
    boss.active = false;
    boss.action = null;
    boss.shockRing.visible = false;
    Game.state.bossActive = false;
    boss.group.scale.setScalar(0.7);
    boss.group.position.y = GROUND_Y - 0.7;
    boss.bodyMaterial.color.set(0x263237);
    boss.armorMaterial.color.set(0x504047);
    entities.key.pedestal.visible = true;
    Game.dom.bossHud.classList.add('hidden');
    Game.showToast('The Tidewarden falls. Its captain’s key waits on the stone throne.', 5200);
    burst(boss.position.clone().add(new THREE.Vector3(0, 3, 0)), 0xffc35c, 75);
    [196, 247, 294, 392, 494].forEach((frequency, index) => window.setTimeout(() => Game.audio.tone(frequency, 0.35, 'triangle', 0.06), index * 130));
    if (Game.audio.bossGain) Game.audio.bossGain.gain.setTargetAtTime(0, Game.audio.context.currentTime, 0.5);
    Game.updateHud();
  }

  function resolvePlayerAttack() {
    const boss = entities.boss;
    if (!boss.active || Game.state.bossDefeated) return;
    const player = Game.player;
    const bossVector = new THREE.Vector3(boss.position.x - player.position.x, 0, boss.position.z - player.position.z);
    const distance = bossVector.length();
    if (distance > 4.7) return;
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    if (distance > 0.1 && forward.dot(bossVector.clone().normalize()) < 0.08) return;
    player.attackHit = true;
    damageBoss(13);
    if (bossVector.lengthSq() > 0.01) {
      const knockDirection = bossVector.normalize();
      boss.position.x += knockDirection.x * 0.34;
      boss.position.z += knockDirection.z * 0.34;
    }
  }

  function updateBoss(delta, elapsed) {
    const boss = entities.boss;
    boss.hitFlash = Math.max(0, boss.hitFlash - delta);
    boss.stagger = Math.max(0, boss.stagger - delta);
    if (!boss.active || Game.state.bossDefeated) {
      if (boss.group.position.y < GROUND_Y + 2 && Game.state.bossDefeated) boss.group.rotation.z = Game.damp(boss.group.rotation.z, 0.26, 1.4, delta);
      return;
    }
    const player = Game.player;
    const center = definitions[4].center;
    const toPlayer = new THREE.Vector3(player.position.x - boss.position.x, 0, player.position.z - boss.position.z);
    const distance = toPlayer.length();
    const targetRotation = Math.atan2(-toPlayer.x, -toPlayer.z);
    let rotationDifference = Math.atan2(Math.sin(targetRotation - boss.group.rotation.y), Math.cos(targetRotation - boss.group.rotation.y));
    boss.group.rotation.y += rotationDifference * Math.min(1, delta * 4.5);
    boss.attackCooldown = Math.max(0, boss.attackCooldown - delta);
    boss.slamCooldown = Math.max(0, boss.slamCooldown - delta);
    const speed = boss.enraged ? 3.35 : 2.45;
    if (!boss.action && boss.stagger <= 0 && distance > 3.5) {
      const move = toPlayer.clone().normalize().multiplyScalar(speed * delta);
      const nextX = boss.position.x + move.x;
      const nextZ = boss.position.z + move.z;
      const fromCenter = Math.hypot(nextX - center.x, nextZ - center.y);
      if (fromCenter < definitions[4].radius - 2.2) {
        boss.position.x = nextX;
        boss.position.z = nextZ;
      }
    }
    if (boss.attackCooldown <= 0 && !boss.action && boss.stagger <= 0) {
      if (distance < 18 && boss.slamCooldown <= 0) {
        beginBossAction('slam');
        boss.attackCooldown = boss.enraged ? 1.15 : 1.75;
        boss.slamCooldown = boss.enraged ? 2.5 : 3.7;
      } else if (distance < 4.9) {
        beginBossAction('melee');
        boss.attackCooldown = boss.enraged ? 0.8 : 1.15;
      }
    }
    const walk = Math.sin(elapsed * (boss.enraged ? 7 : 5.2)) * 0.08;
    boss.legs[0].rotation.x = walk;
    boss.legs[1].rotation.x = -walk;
    boss.body.position.y = 4.3 + Math.sin(elapsed * 2.2) * 0.13;
    boss.head.position.y = 7.1 + Math.sin(elapsed * 1.7) * 0.08;
    boss.chest.material.emissive.setHex(boss.hitFlash > 0 ? 0xffb088 : boss.enraged ? 0x8b140d : 0x390508);
    boss.chest.material.emissiveIntensity = boss.hitFlash > 0 ? 1.4 : 0.6;
    if (boss.action) {
      const action = boss.action;
      action.elapsed += delta;
      const progress = Game.clamp(action.elapsed / action.duration, 0, 1);
      if (action.type === 'melee') {
        boss.trident.rotation.x = -Math.sin(progress * Math.PI) * 1.7;
        if (progress >= 0.58 && !action.hit) {
          action.hit = true;
          if (distance < 5.4) Game.damagePlayer(boss.enraged ? 17 : 12, toPlayer.clone().normalize().multiplyScalar(0.8).x, toPlayer.clone().normalize().multiplyScalar(0.8).z);
          Game.audio.tone(82, 0.18, 'square', 0.05);
        }
      } else {
        const ringProgress = Game.clamp(progress / 0.78, 0, 1);
        boss.shockRing.scale.setScalar(0.12 + ringProgress * 0.9);
        boss.shockMaterial.opacity = 0.85 * (1 - ringProgress * 0.55);
        boss.trident.rotation.x = -progress * 1.9;
        boss.group.position.y = GROUND_Y - Math.sin(progress * Math.PI) * 0.25;
        if (progress >= 0.78 && !action.hit) {
          action.hit = true;
          if (distance < 14.5) Game.damagePlayer(boss.enraged ? 21 : 16, toPlayer.clone().normalize().multiplyScalar(1.5).x, toPlayer.clone().normalize().multiplyScalar(1.5).z);
          burst(new THREE.Vector3(boss.position.x, GROUND_Y + 0.25, boss.position.z), 0xff6a43, 34);
          Game.cameraShake = 0.24;
        }
      }
      if (action.elapsed >= action.duration) {
        boss.action = null;
        boss.shockRing.visible = false;
        boss.trident.rotation.x = 0;
        boss.group.position.y = GROUND_Y;
      }
    }
  }

  function updateSword(delta) {
    const player = Game.player;
    let targetX = 0.52;
    let targetY = -0.46;
    let targetZ = -0.72;
    let targetRotationX = -0.18;
    let targetRotationY = -0.3;
    let targetRotationZ = -0.12;
    if (player.attackElapsed < 0.48) {
      const progress = Game.clamp(player.attackElapsed / 0.48, 0, 1);
      const arc = Math.sin(progress * Math.PI);
      targetX = 0.52 - arc * 0.45;
      targetY = -0.46 + arc * 0.35;
      targetZ = -0.72 - arc * 0.35;
      targetRotationX = -0.18 - arc * 0.9;
      targetRotationY = -0.3 + arc * 1.2;
      targetRotationZ = -0.12 + progress * 1.25;
    }
    entities.sword.position.x = Game.damp(entities.sword.position.x, targetX, 24, delta);
    entities.sword.position.y = Game.damp(entities.sword.position.y, targetY, 24, delta);
    entities.sword.position.z = Game.damp(entities.sword.position.z, targetZ, 24, delta);
    entities.sword.rotation.x = Game.damp(entities.sword.rotation.x, targetRotationX, 24, delta);
    entities.sword.rotation.y = Game.damp(entities.sword.rotation.y, targetRotationY, 24, delta);
    entities.sword.rotation.z = Game.damp(entities.sword.rotation.z, targetRotationZ, 24, delta);
  }

  const entities = {
    ship: null,
    sword: null,
    boss: null,
    key: null
  };
  Game.entities = entities;

  Game.createEntities = () => {
    entities.ship = createShip();
    entities.sword = createSword();
    entities.boss = createBoss();
    entities.key = createKey();
    Game.interactables.push({
      position: new THREE.Vector3(0, GROUND_Y, definitions[4].center.y + 20),
      radius: 3,
      label: () => 'Inspect the silent warden',
      enabled: () => !Game.state.bossActive && !Game.state.bossDefeated,
      onInteract: () => Game.showToast('Four dead seals echo through the stone. The warden is waiting for you to wake it.')
    });
    Game.interactables.push({
      position: new THREE.Vector3(0, GROUND_Y, definitions[4].center.y + 14),
      radius: 2.8,
      label: () => 'Take the captain’s key',
      enabled: () => Game.state.bossDefeated && !Game.state.hasKey,
      onInteract: () => {
        Game.state.hasKey = true;
        entities.key.keyGroup.visible = false;
        entities.key.pedestal.visible = false;
        entities.ship.userData.sail.material.emissive.set(0x3a2410);
        entities.ship.userData.sail.material.emissiveIntensity = 0.18;
        Game.showToast('The captain’s key is yours. Return to the ship and set sail.');
        Game.audio.tone(480, 0.16, 'sine', 0.06);
        window.setTimeout(() => Game.audio.tone(720, 0.24, 'sine', 0.05), 100);
        Game.updateHud();
      }
    });
    Game.interactables.push({
      position: new THREE.Vector3(0, GROUND_Y, Game.dock.endZ - 0.5),
      radius: 3.5,
      label: () => 'Unlock the ship and set sail',
      enabled: () => Game.state.hasKey && !Game.state.sailing,
      onInteract: () => Game.beginSailing()
    });
  };

  Game.updateBoss = updateBoss;
  Game.resolvePlayerAttack = resolvePlayerAttack;
  Game.activateBoss = activateBoss;
  Game.burst = burst;

  Game.updateEntities = (delta, elapsed) => {
    updateBoss(delta, elapsed);
    updateSword(delta);
    updateParticles(delta);
    Game.puzzleStations.forEach((station, index) => {
      station.rune.rotation.y = elapsed * (station.solved ? 1.5 : 0.7 + index * 0.06);
      station.rune.position.y = 2.1 + Math.sin(elapsed * 1.5 + index) * 0.16;
      station.ring.rotation.z = elapsed * 0.32;
      station.beam.material.opacity = station.solved ? 0.3 + Math.sin(elapsed * 2) * 0.06 : 0.13;
    });
    Game.flames.forEach((flame, index) => {
      flame.scale.y = 0.85 + Math.sin(elapsed * 8 + index) * 0.18;
      flame.rotation.y = elapsed * 1.8;
    });
    Game.healables.forEach((item, index) => {
      if (!item.used) {
        item.group.rotation.y = elapsed * 0.9 + index;
        item.group.position.y = GROUND_Y + Math.sin(elapsed * 2.2 + index) * 0.08;
      }
    });
    if (!Game.state.bossDefeated) entities.key.keyGroup.rotation.y = elapsed * 1.35;
  };
})();
