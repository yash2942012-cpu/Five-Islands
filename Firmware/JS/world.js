(() => {
  'use strict';

  const Game = window.FiveIslands;
  if (!Game || !Game.THREE) return;
  const THREE = Game.THREE;
  const { scene, definitions, materials, GROUND_Y, TAU } = Game;

  function createMaterials() {
    const hemi = new THREE.HemisphereLight(0x91dce4, 0x17241e, 0.72);
    scene.add(hemi);
    const sunlight = new THREE.DirectionalLight(0xffdfad, 1.15);
    sunlight.position.set(-120, 190, 70);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    sunlight.shadow.camera.left = -185;
    sunlight.shadow.camera.right = 185;
    sunlight.shadow.camera.top = 185;
    sunlight.shadow.camera.bottom = -185;
    sunlight.shadow.camera.near = 20;
    sunlight.shadow.camera.far = 430;
    sunlight.shadow.bias = -0.00035;
    scene.add(sunlight);
    const violetLight = new THREE.DirectionalLight(0x7d8dff, 0.32);
    violetLight.position.set(80, 45, -80);
    scene.add(violetLight);
    Game.sky.hemi = hemi;
    Game.sky.sunlight = sunlight;
    Game.sky.violet = violetLight;
  }

  function glowTexture() {
    if (Game.sky.glowTexture) return Game.sky.glowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.09)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    Game.sky.glowTexture = texture;
    return texture;
  }

  function createGlow(color, size) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sprite.scale.set(size, size, 1);
    scene.add(sprite);
    return sprite;
  }

  function addBirdFlock(centerX, centerZ, radius, height, count, speed, phase) {
    const group = new THREE.Group();
    const birdMaterial = new THREE.MeshBasicMaterial({ color: 0xe6f2f0, side: THREE.DoubleSide });
    const shape = new THREE.BufferGeometry();
    shape.setAttribute('position', new THREE.Float32BufferAttribute([-1.01, 0, 0.34, -0.12, 0, 0, 0, 0.14, -0.5, 1.01, 0, 0.34, 0.12, 0, 0, 0, 0.14, -0.5], 3));
    shape.computeVertexNormals();
    const birds = [];
    for (let index = 0; index < count; index += 1) {
      const bird = new THREE.Mesh(shape, birdMaterial);
      group.add(bird);
      birds.push({ mesh: bird, offset: index / count });
    }
    scene.add(group);
    Game.sky.birds.push({ group, birds, center: new THREE.Vector2(centerX, centerZ), radius, height, speed, phase });
  }

  function createSky() {
    const skyGeometry = new THREE.SphereGeometry(420, 32, 18);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x061422) },
        horizonColor: { value: new THREE.Color(0x276875) },
        bottomColor: { value: new THREE.Color(0x071018) }
      },
      vertexShader: 'varying vec3 vWorldPosition; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor; varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition).y; vec3 color=mix(horizonColor,topColor,smoothstep(0.0,0.72,h)); color=mix(bottomColor,color,smoothstep(-0.25,0.08,h)); gl_FragColor=vec4(color,1.0); }'
    });
    scene.add(new THREE.Mesh(skyGeometry, skyMaterial));
    const sun = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffe4a8, fog: false }));
    sun.position.set(-190, 118, -240);
    scene.add(sun);
    const sunGlow = createGlow(0xffd08a, 56);
    sunGlow.position.copy(sun.position);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6.5, 18, 18), new THREE.MeshBasicMaterial({ color: 0xdde7ff, fog: false }));
    moon.position.set(155, 105, 225);
    scene.add(moon);
    const moonGlow = createGlow(0x9fb8ff, 34);
    moonGlow.position.copy(moon.position);
    const starPositions = [];
    const random = Game.seededRandom(72819);
    for (let index = 0; index < 620; index += 1) {
      const angle = random() * TAU;
      const elevation = 0.12 + random() * 0.85;
      const radius = 345;
      starPositions.push(Math.cos(angle) * radius * Math.cos(elevation), radius * Math.sin(elevation), Math.sin(angle) * radius * Math.cos(elevation));
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xdaf6ff, size: 0.72, sizeAttenuation: true, transparent: true, opacity: 0.8, fog: false });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    addBirdFlock(0, 0, 26, 32, 4, 0.16, 1.1);
    addBirdFlock(180, 34, 22, 36, 4, 0.2, 2.6);
    addBirdFlock(120, 134, 18, 29, 3, 0.24, 4.2);
    Game.sky.skyMaterial = skyMaterial;
    Game.sky.sun = sun;
    Game.sky.moon = moon;
    Game.sky.sunGlow = sunGlow;
    Game.sky.moonGlow = moonGlow;
    Game.sky.stars = stars;
    Game.sky.starsMaterial = starMaterial;
  }

  function createWater() {
    const geometry = new THREE.PlaneGeometry(700, 700, 60, 60);
    geometry.rotateX(-Math.PI / 2);
    Game.waterPositions = geometry.attributes.position;
    const material = new THREE.MeshPhongMaterial({ color: 0x0b6175, specular: 0x8bdce2, shininess: 85, transparent: true, opacity: 0.96 });
    Game.water = new THREE.Mesh(geometry, material);
    Game.water.receiveShadow = true;
    scene.add(Game.water);
    Game.sky.waterMaterial = material;
    const foamMaterial = new THREE.MeshBasicMaterial({ color: 0x8ee4df, transparent: true, opacity: 0.13, side: THREE.DoubleSide });
    Game.sky.foamMaterial = foamMaterial;
    definitions.forEach((definition) => {
      const foam = new THREE.Mesh(new THREE.RingGeometry(definition.radius - 1.2, definition.radius + 3.8, 64), foamMaterial);
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(definition.center.x, 0.05, definition.center.y);
      scene.add(foam);
      Game.sky.foam.push(foam);
      const surf = new THREE.Mesh(new THREE.RingGeometry(definition.radius + 5, definition.radius + 12, 48), new THREE.MeshBasicMaterial({ color: 0xbdf6ee, transparent: true, opacity: 0.05, side: THREE.DoubleSide }));
      surf.rotation.x = -Math.PI / 2;
      surf.position.set(definition.center.x, 0.03, definition.center.y);
      scene.add(surf);
      Game.sky.foam.push(surf);
    });
    addBuoy(44, 20, 0xff8266);
    addBuoy(100, -60, 0x7fe8dc);
    addBuoy(222, 48, 0xff8266);
    addBuoy(-11, 152, 0x7fe8dc);
    addSailboat(244, -74, -0.7, 1.1);
    addSailboat(-156, 128, 1.9, 0.9);
    addSailboat(88, 296, 3.3, 1.25);
    addRowboat(30, -40, 0.7);
  }

  function addRowboat(x, z, rotation) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.46, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.9 }));
    hull.rotation.x = Math.PI / 2;
    hull.scale.y = 0.5;
    hull.position.y = 0.45;
    hull.castShadow = true;
    group.add(hull);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.5), materials.wood);
    seat.position.y = 0.62;
    group.add(seat);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), materials.rope);
    oar.position.set(0.95, 0.72, 0);
    oar.rotation.z = 1.05;
    group.add(oar);
    scene.add(group);
    Game.sky.boats.push(group);
  }

  function addBuoy(x, z, color) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const float = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 1.1, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
    float.position.y = 0.55;
    group.add(float);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0xf2ead5, roughness: 0.8 }));
    band.position.y = 0.72;
    group.add(band);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), materials.rope);
    pole.position.y = 1.6;
    group.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 4), new THREE.MeshStandardMaterial({ color: 0xf4d78a, roughness: 0.8 }));
    flag.position.set(0.22, 2.25, 0);
    flag.rotation.z = -Math.PI / 2;
    group.add(flag);
    scene.add(group);
    Game.sky.buoys.push(group);
  }

  function addSailboat(x, z, rotation, scale) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.scale.setScalar(scale);
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.5, 4.6, 6), new THREE.MeshStandardMaterial({ color: 0x6f4a33, roughness: 0.9 }));
    hull.rotation.x = Math.PI / 2;
    hull.scale.y = 0.55;
    hull.position.y = 0.55;
    group.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 6), materials.rope);
    mast.position.y = 2.8;
    group.add(mast);
    const sail = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xe8ddc2, side: THREE.DoubleSide, roughness: 0.85 }));
    sail.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 4.7, 0, 0, 1, 0, 2.1, 1.2, 0], 3));
    sail.geometry.computeVertexNormals();
    group.add(sail);
    scene.add(group);
    Game.sky.boats.push(group);
  }

  function labelSprite(text, color = '#f7e1a0', width = 9) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 112;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(3,15,22,0)');
    gradient.addColorStop(0.16, 'rgba(3,15,22,0.78)');
    gradient.addColorStop(0.84, 'rgba(3,15,22,0.78)');
    gradient.addColorStop(1, 'rgba(3,15,22,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 17, canvas.width, 78);
    context.fillStyle = color;
    context.font = '700 34px Georgia';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text.toUpperCase(), 256, 56);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(width, width * 112 / 512, 1);
    return sprite;
  }

  function addRock(parent, x, z, scale, color = 0x5c6262) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.96 }));
    rock.position.set(x, GROUND_Y + scale * 0.33, z);
    rock.scale.y = 0.55 + Math.random() * 0.45;
    rock.rotation.set(Math.random() * 0.6, Math.random() * TAU, Math.random() * 0.4);
    rock.castShadow = true;
    rock.receiveShadow = true;
    parent.add(rock);
  }

  function addPalm(parent, x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y, z);
    group.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 5.8, 7), materials.wood);
    trunk.position.y = 2.8;
    trunk.rotation.z = (Math.random() - 0.5) * 0.18;
    trunk.castShadow = true;
    group.add(trunk);
    for (let index = 0; index < 6; index += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.8, 4), index % 2 ? materials.leaf : materials.leafLight);
      leaf.position.set(Math.sin(index / 6 * TAU) * 1.35, 5.55, Math.cos(index / 6 * TAU) * 1.35);
      leaf.rotation.z = Math.PI / 2.4;
      leaf.rotation.y = index / 6 * TAU;
      leaf.scale.y = 0.5;
      leaf.castShadow = true;
      group.add(leaf);
    }
    parent.add(group);
  }

  function addJungleTree(parent, x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y, z);
    group.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.15, 8, 7), materials.darkWood);
    trunk.position.y = 4;
    trunk.castShadow = true;
    group.add(trunk);
    const canopyA = new THREE.Mesh(new THREE.IcosahedronGeometry(3.1, 1), materials.leaf);
    canopyA.position.y = 8.1;
    canopyA.scale.set(1.25, 0.9, 1.05);
    canopyA.castShadow = true;
    group.add(canopyA);
    const canopyB = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), materials.leafLight);
    canopyB.position.set(1.5, 7.3, 0.3);
    group.add(canopyB);
    parent.add(group);
  }

  function addCrystal(parent, x, z, color, scale = 1) {
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.38, roughness: 0.28, metalness: 0.18 });
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y, z);
    group.scale.setScalar(scale);
    for (let index = 0; index < 3; index += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.55 + index * 0.08, 3.5 + index, 5), material);
      crystal.position.set((index - 1) * 0.75, 1.8 + index * 0.45, Math.sin(index * 2) * 0.45);
      crystal.rotation.z = (index - 1) * 0.17;
      crystal.castShadow = true;
      group.add(crystal);
    }
    parent.add(group);
  }

  function addPillar(parent, x, z, height = 5, broken = false) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 2.3), materials.paleStone);
    base.position.y = 0.22;
    group.add(base);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.82, height, 8), materials.paleStone);
    shaft.position.y = height / 2 + 0.35;
    shaft.rotation.z = broken ? 0.08 : 0;
    shaft.castShadow = true;
    group.add(shaft);
    if (broken) {
      const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), materials.paleStone);
      chunk.position.set(0.4, height + 0.2, 0);
      group.add(chunk);
    } else {
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), materials.paleStone);
      top.position.y = height + 0.6;
      group.add(top);
    }
    parent.add(group);
  }

  function addDriftwood(parent, x, z, rotation) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y + 0.2, z);
    group.rotation.y = rotation;
    const material = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.95 });
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.8, 7), material);
    log.rotation.z = Math.PI / 2;
    log.castShadow = true;
    group.add(log);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.1, 5), material);
    branch.position.set(0.5, 0.18, 0);
    branch.rotation.z = Math.PI / 2.8;
    branch.rotation.y = 0.5;
    group.add(branch);
    parent.add(group);
  }

  function addShell(parent, x, z, color) {
    const shell = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.28, 7), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    shell.position.set(x, GROUND_Y + 0.12, z);
    shell.scale.z = 0.6;
    shell.rotation.y = Math.random() * TAU;
    parent.add(shell);
  }

  function addTidePool(parent, x, z, radius) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y + 0.02, z);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.2, 6, 22), materials.stone);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.04;
    group.add(rim);
    if (!materials.poolWater) materials.poolWater = new THREE.MeshPhongMaterial({ color: 0x3aa9a4, specular: 0xc6fff8, shininess: 90, transparent: true, opacity: 0.8 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(radius - 0.08, 22), materials.poolWater);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.11;
    group.add(water);
    [[0.5, -0.8, 0xffd9b8], [0.9, 0.5, 0xf7c4cf], [-0.4, 0.9, 0xfff0c8]].forEach(([sx, sz, color]) => {
      const shell = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.24, 7), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
      shell.position.set(sx, 0.15, sz);
      shell.scale.z = 0.6;
      shell.rotation.y = sx * 4;
      group.add(shell);
    });
    parent.add(group);
  }

  function createCampfire(parent, x, z) {
    const group = new THREE.Group();
    group.position.set(x, GROUND_Y, z);
    for (let index = 0; index < 8; index += 1) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), materials.stone);
      const angle = index / 8 * TAU;
      stone.position.set(Math.sin(angle) * 0.85, 0.15, Math.cos(angle) * 0.85);
      group.add(stone);
    }
    for (let index = 0; index < 4; index += 1) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.25, 6), materials.darkWood);
      log.rotation.z = Math.PI / 2.2;
      log.rotation.y = index / 4 * TAU;
      log.position.y = 0.25;
      group.add(log);
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 7), new THREE.MeshBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.9 }));
    flame.position.y = 0.85;
    group.add(flame);
    Game.flames.push(flame);
    parent.add(group);
  }

  function createPuzzleStation(definition, index) {
    const group = new THREE.Group();
    const x = definition.center.x - 8;
    const z = definition.center.y + 5;
    group.position.set(x, GROUND_Y, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.65, 10), materials.paleStone);
    base.position.y = 0.33;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    const runeMaterial = new THREE.MeshStandardMaterial({ color: definition.accent, emissive: definition.accent, emissiveIntensity: 0.65, roughness: 0.28, metalness: 0.22 });
    const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), runeMaterial);
    rune.position.y = 2.1;
    rune.castShadow = true;
    group.add(rune);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.09, 8, 36), runeMaterial);
    ring.position.y = 2.1;
    ring.rotation.x = Math.PI / 2.6;
    group.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 2, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: definition.accent, transparent: true, opacity: 0.13, depthWrite: false }));
    beam.position.y = 7;
    group.add(beam);
    const shortName = definition.name.replace(' Cay', '').replace(' Ruins', '').replace(' Reach', '').replace(' Vault', '').replace(' Crown', '');
    const label = labelSprite(shortName, '#a7fff2', 10);
    label.position.set(0, 10, 0);
    group.add(label);
    scene.add(group);
    const station = { group, rune, ring, beam, runeMaterial, position: new THREE.Vector3(x, GROUND_Y, z), solved: false };
    Game.puzzleStations.push(station);
    Game.interactables.push({
      position: station.position,
      radius: 3.3,
      label: () => Game.state.solved[index] ? 'The seal is awake' : 'Read the rune altar',
      enabled: () => !Game.state.solved[index],
      onInteract: () => Game.openPuzzle(index)
    });
  }

  function createHealingItem(definition, index, xOffset, zOffset) {
    if (index === 4) return;
    const group = new THREE.Group();
    const position = new THREE.Vector3(definition.center.x + xOffset, GROUND_Y, definition.center.y + zOffset);
    group.position.copy(position);
    const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: 0x70ffbe, emissive: 0x35d98a, emissiveIntensity: 0.55, roughness: 0.4 }));
    fruit.position.y = 0.85;
    fruit.castShadow = true;
    group.add(fruit);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), materials.leafLight);
    leaf.position.set(0.3, 1.45, 0);
    leaf.rotation.z = -0.7;
    group.add(leaf);
    const light = new THREE.PointLight(0x64ffad, 0.8, 6, 2);
    light.position.y = 1;
    group.add(light);
    scene.add(group);
    const item = { group, used: false, position };
    Game.healables.push(item);
    Game.interactables.push({
      position,
      radius: 2.4,
      label: () => 'Drink a restorative coconut',
      enabled: () => !item.used,
      onInteract: () => {
        item.used = true;
        group.visible = false;
        Game.player.health = Game.clamp(Game.player.health + 35, 0, 100);
        Game.updateHud();
        Game.showToast('The coconut restores 35 vitality.');
        Game.audio.tone(420, 0.18, 'sine', 0.05);
        window.setTimeout(() => Game.audio.tone(620, 0.22, 'sine', 0.04), 110);
      }
    });
  }

  function createIsland(definition, index) {
    const group = new THREE.Group();
    group.position.set(definition.center.x, 0, definition.center.y);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(definition.radius, definition.radius * 0.88, 3.5, 48), new THREE.MeshStandardMaterial({ color: definition.color, roughness: 0.98 }));
    base.position.y = -0.25;
    base.receiveShadow = true;
    base.castShadow = true;
    group.add(base);
    const surface = new THREE.Mesh(new THREE.CylinderGeometry(definition.radius, definition.radius, 0.22, 48), new THREE.MeshStandardMaterial({ color: definition.sand, roughness: 0.95 }));
    surface.position.y = 1.52;
    surface.receiveShadow = true;
    group.add(surface);
    const random = Game.seededRandom(510 + index * 97);
    for (let rockIndex = 0; rockIndex < 34; rockIndex += 1) {
      const angle = random() * TAU;
      const radius = definition.radius * (0.74 + random() * 0.2);
      addRock(group, Math.sin(angle) * radius, Math.cos(angle) * radius, 0.7 + random() * 1.5, index === 4 ? 0x3d3a42 : 0x5c6262);
    }
    if (definition.theme === 'shore') {
      [[-19, -16, 1.05], [21, -20, 0.85], [25, 17, 1.12], [-23, 20, 0.94], [4, -26, 0.8], [27, 3, 1.05], [-28, -2, 0.88], [11, 26, 0.96]].forEach(([x, z, scale]) => addPalm(group, x, z, scale));
      const camp = new THREE.Group();
      camp.position.set(-14, GROUND_Y, 12);
      const tent = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4, 4), new THREE.MeshStandardMaterial({ color: 0xb06f4b, roughness: 0.92 }));
      tent.position.y = 1.85;
      tent.rotation.y = Math.PI / 4;
      tent.castShadow = true;
      camp.add(tent);
      group.add(camp);
      createCampfire(group, -12, 8);
    }
    if (definition.theme === 'coral') {
      [[-22, -14, 0x45e6d5, 1.2], [22, -19, 0xa35cff, 0.9], [24, 18, 0x5affd2, 1.1], [-24, 20, 0xff72b7, 0.72], [6, -28, 0x5ad4ff, 0.86], [-6, 27, 0xb07bff, 1], [29, -3, 0x5affd2, 0.8], [-29, 4, 0xff72b7, 0.95]].forEach(([x, z, color, scale]) => addCrystal(group, x, z, color, scale));
      for (let crystalIndex = 0; crystalIndex < 26; crystalIndex += 1) {
        const angle = random() * TAU;
        const radius = 12 + random() * 17;
        addCrystal(group, Math.sin(angle) * radius, Math.cos(angle) * radius, crystalIndex % 2 ? 0x50cbbd : 0x8a5ac8, 0.28 + random() * 0.42);
      }
    }
    if (definition.theme === 'jungle') {
      [[-20, -18, 1], [19, -22, 0.9], [24, 17, 1.1], [-25, 16, 0.82], [-6, -27, 0.72], [8, 27, 0.78], [-28, -4, 1.05], [29, 3, 0.95], [-12, 22, 0.68], [16, 21, 0.74], [12, -13, 0.62], [-17, 8, 0.7], [24, -8, 0.66], [-27, -12, 0.9]].forEach(([x, z, scale]) => addJungleTree(group, x, z, scale));
    }
    if (definition.theme === 'moon') {
      for (let pillarIndex = 0; pillarIndex < 20; pillarIndex += 1) {
        const angle = pillarIndex / 20 * TAU;
        addPillar(group, Math.sin(angle) * 21, Math.cos(angle) * 21, 4.5 + (pillarIndex % 4), pillarIndex % 5 === 2 || pillarIndex % 5 === 3);
      }
      const well = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 1.4, 24), materials.paleStone);
      well.position.set(-7, GROUND_Y + 0.4, 7);
      well.castShadow = true;
      group.add(well);
      const wellWater = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.58 }));
      wellWater.rotation.x = -Math.PI / 2;
      wellWater.position.set(-7, GROUND_Y + 1.1, 7);
      group.add(wellWater);
    }
    if (definition.theme === 'ash') {
      for (let crystalIndex = 0; crystalIndex < 30; crystalIndex += 1) {
        const angle = random() * TAU;
        const radius = 12 + random() * 20;
        addCrystal(group, Math.sin(angle) * radius, Math.cos(angle) * radius, crystalIndex % 3 === 0 ? 0xff594f : 0x663b70, 0.4 + random() * 0.85);
      }
      for (let statueIndex = 0; statueIndex < 10; statueIndex += 1) {
        const angle = (statueIndex + 0.5) / 10 * TAU;
        addPillar(group, Math.sin(angle) * 27, Math.cos(angle) * 27, 3.8 + (statueIndex % 3), statueIndex % 2 === 0);
      }
    }
    addTidePool(group, definition.radius * 0.52, -definition.radius * 0.62, 1.5);
    addTidePool(group, -definition.radius * 0.58, -definition.radius * 0.5, 1.2);
    addDriftwood(group, definition.radius * 0.62, definition.radius * 0.55, index * 0.7);
    addDriftwood(group, -definition.radius * 0.4, definition.radius * 0.7, index * 1.3 + 0.6);
    for (let shellIndex = 0; shellIndex < 5; shellIndex += 1) {
      const angle = random() * TAU;
      const radius = definition.radius * (0.5 + random() * 0.35);
      addShell(group, Math.sin(angle) * radius, Math.cos(angle) * radius, shellIndex % 2 ? 0xffd8b4 : 0xf3bfc8);
    }
    if (definition.theme === 'ash') {
      createCampfire(group, 12, -14);
      createCampfire(group, -14, -12);
    }
    const label = labelSprite(definition.name, '#f5dda0', 13.5);
    label.position.set(0, 22, 0);
    group.add(label);
    scene.add(group);
    if (index < 4) {
      createPuzzleStation(definition, index);
      createHealingItem(definition, index, 8, -6);
    }
  }

  function createBridge(startDefinition, endDefinition) {
    const direction = endDefinition.center.clone().sub(startDefinition.center).normalize();
    const start = startDefinition.center.clone().add(direction.clone().multiplyScalar(startDefinition.radius - 0.4));
    const end = endDefinition.center.clone().sub(direction.clone().multiplyScalar(endDefinition.radius - 0.4));
    const delta = end.clone().sub(start);
    const length = delta.length();
    const group = new THREE.Group();
    group.position.set((start.x + end.x) / 2, GROUND_Y - 0.14, (start.y + end.y) / 2);
    group.rotation.y = Math.atan2(delta.x, delta.y);
    const boardCount = Math.ceil(length / 1.35);
    const boardGeometry = new THREE.BoxGeometry(4.2, 0.28, 1.12);
    for (let index = 0; index < boardCount; index += 1) {
      const board = new THREE.Mesh(boardGeometry, materials.wood);
      board.position.z = -length / 2 + index * (length / boardCount);
      board.rotation.y = (index % 2 ? 1 : -1) * 0.012;
      board.castShadow = true;
      board.receiveShadow = true;
      group.add(board);
    }
    const railGeometry = new THREE.CylinderGeometry(0.06, 0.06, length, 6);
    [-2.05, 2.05].forEach((x) => {
      const rail = new THREE.Mesh(railGeometry, materials.rope);
      rail.position.set(x, 1.25, 0);
      rail.rotation.x = Math.PI / 2;
      group.add(rail);
    });
    const postGeometry = new THREE.CylinderGeometry(0.09, 0.12, 1.65, 6);
    for (let index = 0; index <= boardCount; index += 4) {
      [-2.05, 2.05].forEach((x) => {
        const post = new THREE.Mesh(postGeometry, materials.darkWood);
        post.position.set(x, 0.68, -length / 2 + index * (length / boardCount));
        group.add(post);
      });
    }
    scene.add(group);
    Game.bridges.push({ start, end, halfWidth: 1.72 });
  }

  function createDock() {
    const group = new THREE.Group();
    const length = Game.dock.endZ - Game.dock.startZ;
    group.position.set(0, GROUND_Y - 0.12, (Game.dock.startZ + Game.dock.endZ) / 2);
    const boardCount = Math.ceil(length / 1.15);
    const boardGeometry = new THREE.BoxGeometry(5.2, 0.26, 0.92);
    for (let index = 0; index < boardCount; index += 1) {
      const board = new THREE.Mesh(boardGeometry, materials.wood);
      board.position.z = -length / 2 + index * (length / boardCount);
      board.receiveShadow = true;
      group.add(board);
    }
    [-2.35, 2.35].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, length, 6), materials.rope);
      rail.position.set(x, 1.18, 0);
      rail.rotation.x = Math.PI / 2;
      group.add(rail);
      for (let postZ = -length / 2; postZ <= length / 2; postZ += 3) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.65, 6), materials.darkWood);
        post.position.set(x, 0.65, postZ);
        group.add(post);
      }
    });
    scene.add(group);
  }

  function createAtmosphereEffects() {
    const cloudMaterial = new THREE.MeshLambertMaterial({ color: 0x9ac1c5, transparent: true, opacity: 0.14, depthWrite: false });
    for (let cloudIndex = 0; cloudIndex < 18; cloudIndex += 1) {
      const group = new THREE.Group();
      const angle = cloudIndex / 18 * TAU;
      const radius = 150 + (cloudIndex % 5) * 40;
      const baseX = 80 + Math.cos(angle) * radius;
      const baseZ = 55 + Math.sin(angle) * radius;
      group.position.set(baseX, 42 + (cloudIndex % 4) * 7, baseZ);
      for (let puffIndex = 0; puffIndex < 4; puffIndex += 1) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(5 + puffIndex * 0.5, 10, 8), cloudMaterial);
        puff.position.x = puffIndex * 4.5 - 6;
        puff.scale.y = 0.45;
        group.add(puff);
      }
      scene.add(group);
      Game.sky.clouds.push({ group, x: baseX, z: baseZ, phase: cloudIndex * 0.7 });
    }
    const wispMaterial = new THREE.MeshLambertMaterial({ color: 0xc7dde0, transparent: true, opacity: 0.07, depthWrite: false });
    for (let index = 0; index < 7; index += 1) {
      const angle = index / 7 * TAU + 0.4;
      const radius = 230 + (index % 3) * 45;
      const group = new THREE.Group();
      group.position.set(80 + Math.cos(angle) * radius, 82 + (index % 3) * 12, 55 + Math.sin(angle) * radius);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(14, 12, 8), wispMaterial);
      puff.scale.set(2.4, 0.28, 1);
      group.add(puff);
      scene.add(group);
      Game.sky.clouds.push({ group, x: group.position.x, z: group.position.z, phase: index * 1.1 + 3 });
    }
    const positions = [];
    const base = [];
    const random = Game.seededRandom(90210);
    [[0, 0, 26], [180, 34, 28], [120, 134, 30]].forEach(([centerX, centerZ, spread]) => {
      for (let index = 0; index < 30; index += 1) {
        const angle = random() * TAU;
        const radius = 4 + random() * spread;
        const x = centerX + Math.sin(angle) * radius;
        const z = centerZ + Math.cos(angle) * radius;
        const y = 1.8 + random() * 5.5;
        positions.push(x, y, z);
        base.push(x, y, z);
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xd8ff9a, size: 0.32, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false });
    const fireflies = new THREE.Points(geometry, material);
    scene.add(fireflies);
    Game.sky.fireflies = fireflies;
    Game.sky.fireflyBase = new Float32Array(base);
  }

  const skyNightTop = new THREE.Color(0x061422);
  const skyDayTop = new THREE.Color(0x2f7fb0);
  const skyNightHorizon = new THREE.Color(0x276875);
  const skyDayHorizon = new THREE.Color(0xa9dcda);
  const skySunset = new THREE.Color(0xe5925d);
  const skyNightBottom = new THREE.Color(0x071018);
  const skyDayBottom = new THREE.Color(0x2b6770);
  const fogNight = new THREE.Color(0x0a3440);
  const fogDay = new THREE.Color(0x9cc9cc);
  const fogSunset = new THREE.Color(0xd79a74);
  const lightNight = new THREE.Color(0x8ea8ff);
  const lightDay = new THREE.Color(0xfff3d6);
  const lightWarm = new THREE.Color(0xffa066);
  const hemiNight = new THREE.Color(0x3f5a86);
  const hemiDay = new THREE.Color(0xc4eef0);
  const groundNight = new THREE.Color(0x0e1622);
  const groundDay = new THREE.Color(0x2f4030);
  const waterNight = new THREE.Color(0x0a2c40);
  const waterDay = new THREE.Color(0x1d8296);
  const specNight = new THREE.Color(0x5d7fa8);
  const specDay = new THREE.Color(0xcdfbf2);
  const fogColor = new THREE.Color();

  Game.updateAtmosphere = (delta, elapsed) => {
    const sky = Game.sky;
    sky.time = (sky.time + delta / sky.cycle) % 1;
    const angle = sky.time * TAU;
    const sunHeight = Math.sin(angle);
    const day = Game.clamp(sunHeight * 1.9 + 0.22, 0, 1);
    const twilight = Game.clamp(1 - Math.abs(sunHeight) * 3.4, 0, 1);
    const night = 1 - day;
    Game.tide = Math.sin(elapsed * TAU / 46);

    const sunRadius = 330;
    sky.sun.position.set(Math.cos(angle) * sunRadius, sunHeight * 240, -120 + Math.sin(angle * 0.5) * 50);
    sky.moon.position.set(-Math.cos(angle) * sunRadius, -sunHeight * 220, 130 - Math.sin(angle * 0.5) * 40);
    sky.sun.visible = sunHeight > -0.16;
    sky.moon.visible = sunHeight < 0.16;
    sky.sunGlow.position.copy(sky.sun.position);
    sky.moonGlow.position.copy(sky.moon.position);
    sky.sunGlow.visible = sky.sun.visible;
    sky.moonGlow.visible = sky.moon.visible;
    sky.sunGlow.material.opacity = 0.3 + twilight * 0.4;
    sky.moonGlow.material.opacity = 0.26 + night * 0.24;
    sky.sun.scale.setScalar(1 + twilight * 0.35);

    sky.skyMaterial.uniforms.topColor.value.copy(skyNightTop).lerp(skyDayTop, day);
    sky.skyMaterial.uniforms.horizonColor.value.copy(skyNightHorizon).lerp(skyDayHorizon, day).lerp(skySunset, twilight * 0.55);
    sky.skyMaterial.uniforms.bottomColor.value.copy(skyNightBottom).lerp(skyDayBottom, day);

    fogColor.copy(fogNight).lerp(fogDay, day).lerp(fogSunset, twilight * 0.3);
    scene.fog.color.copy(fogColor);
    scene.fog.density = 0.0048 - day * 0.0009;
    if (scene.background && scene.background.isColor) scene.background.copy(fogColor);

    sky.sunlight.intensity = 0.22 + day * 0.98;
    sky.sunlight.color.copy(lightNight).lerp(lightDay, day).lerp(lightWarm, twilight * 0.5);
    sky.hemi.intensity = 0.24 + day * 0.55;
    sky.hemi.color.copy(hemiNight).lerp(hemiDay, day);
    sky.hemi.groundColor.copy(groundNight).lerp(groundDay, day);
    sky.violet.intensity = 0.14 + night * 0.22;
    const lightSource = sunHeight > 0 ? sky.sun.position : sky.moon.position;
    sky.sunlight.position.set(lightSource.x * 0.8, Math.max(70, lightSource.y * 0.8), lightSource.z * 0.8);

    sky.starsMaterial.opacity = Game.clamp((0.1 - sunHeight) * 3.6, 0, 0.9);
    sky.stars.visible = sky.starsMaterial.opacity > 0.02;

    sky.waterMaterial.color.copy(waterNight).lerp(waterDay, day);
    sky.waterMaterial.specular.copy(specNight).lerp(specDay, day);
    sky.waterMaterial.shininess = 70 + day * 25;
    Game.water.position.y = Game.tide * 0.55;
    sky.foam.forEach((foam) => {
      foam.position.y = Game.water.position.y + 0.06;
      foam.scale.setScalar(1 + Game.tide * 0.008);
    });
    sky.foamMaterial.opacity = 0.1 + (1 - Game.tide) * 0.04;

    sky.buoys.forEach((buoy, index) => {
      buoy.position.y = Game.tide * 0.4 + Math.sin(elapsed * 1.1 + index) * 0.08;
      buoy.rotation.z = Math.sin(elapsed * 0.8 + index) * 0.05;
    });
    sky.boats.forEach((boat, index) => {
      boat.position.y = Game.tide * 0.4 + Math.sin(elapsed * 1.2 + index) * 0.08;
      boat.rotation.z = Math.sin(elapsed * 0.8 + index) * 0.035;
    });

    if (sky.fireflies) {
      sky.fireflies.material.opacity = night * 0.95;
      sky.fireflies.visible = sky.fireflies.material.opacity > 0.03;
      if (sky.fireflies.visible) {
        const positions = sky.fireflies.geometry.attributes.position;
        const base = sky.fireflyBase;
        for (let index = 0; index < positions.count; index += 1) {
          const offset = index * 3;
          positions.setXYZ(
            index,
            base[offset] + Math.sin(elapsed * 0.7 + index) * 0.7,
            base[offset + 1] + Math.sin(elapsed * 1.3 + index * 1.7) * 0.3,
            base[offset + 2] + Math.cos(elapsed * 0.6 + index) * 0.7
          );
        }
        positions.needsUpdate = true;
      }
    }

    sky.birds.forEach((flock) => {
      flock.group.visible = day > 0.28;
      if (!flock.group.visible) return;
      flock.group.position.set(flock.center.x, flock.height, flock.center.y);
      flock.birds.forEach((bird, index) => {
        const flightAngle = elapsed * flock.speed + flock.phase + bird.offset * TAU;
        const radius = flock.radius * (0.82 + (index % 3) * 0.12);
        bird.mesh.position.set(Math.cos(flightAngle) * radius, Math.sin(elapsed * 0.9 + index * 1.3) * 0.9, Math.sin(flightAngle) * radius);
        bird.mesh.rotation.y = -flightAngle;
        bird.mesh.rotation.z = Math.sin(elapsed * 6 + index * 2) * 0.35;
      });
    });

    sky.clouds.forEach((cloud) => {
      cloud.group.position.x = cloud.x + Math.sin(elapsed * 0.01 + cloud.phase) * 12;
      cloud.group.position.z = cloud.z + Math.cos(elapsed * 0.008 + cloud.phase) * 12;
    });

    if (Game.entities && Game.entities.ship && !Game.state.sailing) {
      const ship = Game.entities.ship;
      ship.position.y = 0.08 + Game.tide * 0.4 + Math.sin(elapsed * 0.9) * 0.06;
      ship.rotation.z = Math.sin(elapsed * 0.7) * 0.012;
    }
  };

  Game.createWorld = () => {
    createMaterials();
    createSky();
    createWater();
    definitions.forEach(createIsland);
    for (let index = 0; index < definitions.length - 1; index += 1) createBridge(definitions[index], definitions[index + 1]);
    createDock();
    createAtmosphereEffects();
  };
})();
