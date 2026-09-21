import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createStringLights, createLantern, createSignpost } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 5 — Street of Flavors & Food Bazaar.
 * 
 * 4 Distinct, beautifully detailed artisan food shops:
 * 1. Gourmet Burger Bar: Stacked brioche sesame burger, curly/shoestring fries, ketchup & mustard bottles, fountain soda.
 * 2. Pani Puri & Chaat Corner: Crispy puris in glass jar, terracotta matkas with mint pani & tamarind sonth, dahi papdi chaat with pomegranate.
 * 3. Artisan Bakery & Cheesecake: Glass patisserie display with sliced NY strawberry cheesecake, croissants & cupcakes.
 * 4. Crispy Chicken Shop: Red-and-white bucket with crunchy golden drumsticks, sizzling tandoori skewers, garlic mayo & peri-peri dips.
 * 
 * Arranged around a stone-paved dining courtyard with picnic tables, shared feast trays, and high overhead Edison string lights!
 */
export function buildFoodStreet(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(9312);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -0.32;
  ctx.scene.add(group);

  // --- Stone Paved Plaza Ground ---
  const plazaW = 18.5;
  const plazaD = 17.5;
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(plazaW, 0.14, plazaD),
    MAT.sandstone
  );
  plaza.position.set(0, 0.07, 0);
  plaza.receiveShadow = true;
  group.add(plaza);

  // Paved cobblestone border trim
  const borderTrim = new THREE.Mesh(
    new THREE.BoxGeometry(plazaW + 0.4, 0.16, plazaD + 0.4),
    MAT.stone
  );
  borderTrim.position.set(0, 0.05, 0);
  borderTrim.receiveShadow = true;
  group.add(borderTrim);

  // --- Shop 1: Gourmet Burger Bar (West North: lx = -6.4, lz = -4.2) ---
  const burgerShop = buildBurgerShop(ctx);
  burgerShop.position.set(-6.4, 0, -4.2);
  burgerShop.rotation.y = Math.PI / 2;
  group.add(burgerShop);
  ctx.addLocalCircle(group, -6.4, -4.2, 2.2);

  // --- Shop 2: Pani Puri & Chaat Corner (West South: lx = -6.4, lz = 4.2) ---
  const chaatShop = buildPaniPuriShop(ctx);
  chaatShop.position.set(-6.4, 0, 4.2);
  chaatShop.rotation.y = Math.PI / 2;
  group.add(chaatShop);
  ctx.addLocalCircle(group, -6.4, 4.2, 2.2);

  // --- Shop 3: Bakery & Cheesecake Patisserie (East North: lx = 6.4, lz = -4.2) ---
  const bakeryShop = buildBakeryShop(ctx);
  bakeryShop.position.set(6.4, 0, -4.2);
  bakeryShop.rotation.y = -Math.PI / 2;
  group.add(bakeryShop);
  ctx.addLocalCircle(group, 6.4, -4.2, 2.2);

  // --- Shop 4: Crispy & Grilled Chicken Shop (East South: lx = 6.4, lz = 4.2) ---
  const chickenShop = buildChickenShop(ctx);
  chickenShop.position.set(6.4, 0, 4.2);
  chickenShop.rotation.y = -Math.PI / 2;
  group.add(chickenShop);
  ctx.addLocalCircle(group, 6.4, 4.2, 2.2);

  // --- Central Dining Area: Picnic Tables with Shared Food & Drinks ---
  const table1 = buildPicnicTable({ withBurgerFeast: true });
  table1.position.set(0, 0, -2.0);
  group.add(table1);
  ctx.addLocalCircle(group, 0, -2.0, 1.4);

  const table2 = buildPicnicTable({ withDessertFeast: true });
  table2.position.set(0, 0, 2.5);
  group.add(table2);
  ctx.addLocalCircle(group, 0, 2.5, 1.4);

  // Sit at picnic table interaction (Table 1)
  const table1World = ctx.localToWorld(group, 0, -2.0);
  ctx.interactions.register({
    id: 'food_sit_north',
    x: table1World.x,
    z: table1World.z,
    radius: 1.8,
    label: 'Sit & enjoy burger & fries',
    activeLabel: 'Stand up',
    onEnter: (character) => {
      character.sitOn({
        x: table1World.x,
        z: table1World.z,
        y: 0.15,
        yaw: group.rotation.y + Math.PI / 2
      });
      ctx.messagePanel?.show('Crunchy golden fries and a juicy burger — the happiest food date with Kuchii!');
    },
    onExit: (character) => {
      character.standUp();
      ctx.messagePanel?.hide();
    }
  });

  // Sit at picnic table interaction (Table 2)
  const table2World = ctx.localToWorld(group, 0, 2.5);
  ctx.interactions.register({
    id: 'food_sit',
    x: table2World.x,
    z: table2World.z,
    radius: 1.8,
    label: 'Sit at the food street table',
    activeLabel: 'Stand up',
    onEnter: (character) => {
      character.sitOn({
        x: table2World.x,
        z: table2World.z,
        y: 0.15,
        yaw: group.rotation.y - Math.PI / 2
      });
      ctx.messagePanel?.show('A table full of delicious cravings: spicy pani puri, strawberry cheesecake, and cozy sips!');
    },
    onExit: (character) => {
      character.standUp();
      ctx.messagePanel?.hide();
    }
  });

  // --- High Overhead Festoon Poles & Warm Edison String Lights ---
  // 4 tall wooden festoon poles (5.2m) at courtyard corners so lights hang gracefully high above the camera line of sight (camera is at ~4.0m)
  const poleCorners = [
    [-7.8, -7.8],
    [7.8, -7.8],
    [-7.8, 7.8],
    [7.8, 7.8]
  ];
  for (const [px, pz] of poleCorners) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.2, 8), MAT.bark);
    pole.position.set(px, 2.6, pz);
    pole.castShadow = true;
    group.add(pole);

    const poleCap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), MAT.gold);
    poleCap.position.set(px, 5.2, pz);
    group.add(poleCap);
  }

  // High festoon canopy around plaza perimeter and cross spans at y = 5.0m (staying >= 4.65m, strictly above camera eye at 4.0m)
  group.add(createStringLights(-7.6, 5.0, -7.6, 7.6, 5.0, -7.6, { sag: 0.35, bulbs: 12 }));
  group.add(createStringLights(-7.6, 5.0, 7.6, 7.6, 5.0, 7.6, { sag: 0.35, bulbs: 12 }));
  group.add(createStringLights(-7.6, 5.0, -7.6, -7.6, 5.0, 7.6, { sag: 0.35, bulbs: 12 }));
  group.add(createStringLights(7.6, 5.0, -7.6, 7.6, 5.0, 7.6, { sag: 0.35, bulbs: 12 }));
  // Cross spans connecting across the courtyard
  group.add(createStringLights(-7.6, 5.0, -2.5, 7.6, 5.0, -2.5, { sag: 0.35, bulbs: 12 }));
  group.add(createStringLights(-7.6, 5.0, 2.5, 7.6, 5.0, 2.5, { sag: 0.35, bulbs: 12 }));

  const warmStreetGlow = new THREE.PointLight(0xffb766, 12, 24, 2);
  warmStreetGlow.position.set(0, 4.8, 0);
  group.add(warmStreetGlow);

  // --- Corner Flower Planters ---
  for (const [cx, cz] of [[-8.2, -8.2], [8.2, -8.2], [-8.2, 8.2], [8.2, 8.2]]) {
    const planter = buildFlowerPlanter();
    planter.position.set(cx, 0.14, cz);
    group.add(planter);
  }

  // --- Entrance & Exit Street Lanterns ---
  for (const [lx, lz] of [[-9.0, 0], [9.0, 0]]) {
    const lantern = createLantern({ height: 3.2 });
    const world = ctx.localToWorld(group, lx, lz);
    lantern.position.copy(world);
    ctx.scene.add(lantern);
    ctx.addCircle(world.x, world.z, 0.5);
  }

  // --- Heartfelt Wish Signboards in Food Court ---
  const chaatSign = createSignpost({
    boardWidth: 2.1,
    boardHeight: 1.05,
    height: 1.5,
    title: "Your Smile & Giggle 🌸",
    lines: [
      "I'm never going to get bored of your voice.",
      "I love your giggle, your laugh, your gussa, everything...",
      "You are a Khubsurat Insan by heart ❤️"
    ],
    signoff: "— Shikhar ❤️"
  });
  chaatSign.position.set(3.4, 0.14, 3.2);
  chaatSign.rotation.y = -Math.PI * 0.75;
  group.add(chaatSign);
  const chaatSignWorld = ctx.localToWorld(group, 3.4, 3.2);
  ctx.addCircle(chaatSignWorld.x, chaatSignWorld.z, 0.6);

  const entranceSign = createSignpost({
    boardWidth: 2.1,
    boardHeight: 1.05,
    height: 1.5,
    title: "Forever Craving You 🍯",
    lines: [
      "Mai samne baithke sab bolna chahta hu...",
      "I just wanna see your face every single day,",
      "and I crave your presence everydayyyyy ❤️"
    ],
    signoff: "— Shikhar ❤️"
  });
  entranceSign.position.set(-6.8, 0.14, -1.8);
  entranceSign.rotation.y = 0.45;
  group.add(entranceSign);
  const entranceSignWorld = ctx.localToWorld(group, -6.8, -1.8);
  ctx.addCircle(entranceSignWorld.x, entranceSignWorld.z, 0.6);

  // Register interactive surprise triggers for all 4 food counters
  registerFoodSurprises(ctx, group);

  return group;
}

// =============================================================================
// SHOP 1: GOURMET BURGER BAR
// =============================================================================
function buildBurgerShop(ctx) {
  const shop = new THREE.Group();

  const signTex = createSignboardTexture(
    '🍔 GOURMET BURGERS',
    'Smash Patties & Crispy Golden Fries',
    '#261914',
    '#ffbe0b',
    '#fb5607'
  );

  const stall = buildStallShell({
    counterColor: 0x4a3427,
    backWallColor: 0x6e4e37,
    canopyColorA: 0xe07a5f, // Warm rust orange & cream
    canopyColorB: 0xf4f1de,
    signTexture: signTex,
    chalkMenuText: "TODAY'S SPECIAL\n• Double Smash Burger\n• Cheesy Garlic Fries\n• Chilled Soda Float\nMade with Love ❤️"
  });
  shop.add(stall);

  // --- Props: Stacked Gourmet Burger ---
  const burger = new THREE.Group();
  burger.position.set(-0.7, 1.07, 0.45);
  shop.add(burger);

  const bunMat = new THREE.MeshStandardMaterial({ color: 0xd49b55, roughness: 0.55 });
  const pattyMat = new THREE.MeshStandardMaterial({ color: 0x3d2319, roughness: 0.85 });
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.35 });
  const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.45 });
  const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.25 });
  const pickleMat = new THREE.MeshStandardMaterial({ color: 0x386641, roughness: 0.4 });

  // Bottom bun
  const botBun = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.05, 18), bunMat);
  botBun.position.y = 0.025;
  botBun.castShadow = true;
  burger.add(botBun);

  // Juicy beef patty
  const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.065, 18), pattyMat);
  patty.position.y = 0.08;
  patty.castShadow = true;
  burger.add(patty);

  // Melted cheese slice draped over patty with bent corners
  const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), cheeseMat);
  cheese.position.y = 0.12;
  cheese.rotation.y = 0.65;
  burger.add(cheese);

  // Crisp lettuce ruffle
  const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.025, 14), lettuceMat);
  lettuce.position.y = 0.145;
  burger.add(lettuce);

  // Sliced pickles
  for (const px of [-0.08, 0.08]) {
    const pickle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 10), pickleMat);
    pickle.position.set(px, 0.165, 0.04);
    burger.add(pickle);
  }

  // Two juicy red tomato slices
  for (const tx of [-0.07, 0.07]) {
    const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 14), tomatoMat);
    tomato.position.set(tx, 0.185, -0.03);
    burger.add(tomato);
  }

  // Brioche top bun dome
  const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
  topBun.position.y = 0.2;
  topBun.scale.set(1, 0.68, 1);
  topBun.castShadow = true;
  burger.add(topBun);

  // White sesame seeds scattered on top
  const seedMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, roughness: 0.2 });
  for (let i = 0; i < 12; i++) {
    const sAngle = (i / 12) * Math.PI * 2;
    const r = (i % 2 === 0 ? 0.11 : 0.06);
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), seedMat);
    seed.position.set(Math.sin(sAngle) * r, 0.29 + (i % 2 === 0 ? 0.01 : 0.03), Math.cos(sAngle) * r);
    burger.add(seed);
  }

  // --- French Fries Basket ---
  const fryBasket = new THREE.Group();
  fryBasket.position.set(0.35, 1.07, 0.45);
  shop.add(fryBasket);

  const wireMeshMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.28), wireMeshMat);
  basket.position.y = 0.11;
  fryBasket.add(basket);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), wireMeshMat);
  handle.rotation.x = Math.PI / 3;
  handle.position.set(0, 0.24, 0.2);
  fryBasket.add(handle);

  const fryMat = new THREE.MeshStandardMaterial({ color: 0xf5b041, roughness: 0.7 });
  for (let i = 0; i < 22; i++) {
    const fry = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.03), fryMat);
    fry.position.set(
      ((i % 5) - 2) * 0.06 + (Math.random() - 0.5) * 0.02,
      0.18 + Math.random() * 0.06,
      (Math.floor(i / 5) - 2) * 0.045
    );
    fry.rotation.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.35);
    fryBasket.add(fry);
  }

  // --- Squeeze Sauce Bottles (Ketchup & Mustard) ---
  const bottleGroup = new THREE.Group();
  bottleGroup.position.set(0.9, 1.07, 0.45);
  shop.add(bottleGroup);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffbe0b, roughness: 0.4 });

  const ketchup = createCondimentBottle(redMat);
  ketchup.position.x = -0.12;
  bottleGroup.add(ketchup);

  const mustard = createCondimentBottle(yellowMat);
  mustard.position.x = 0.12;
  bottleGroup.add(mustard);

  // Fountain soda cup with striped straw
  const sodaCup = createSodaCup();
  sodaCup.position.set(1.3, 1.07, 0.45);
  shop.add(sodaCup);

  return shop;
}

// =============================================================================
// SHOP 2: PANI PURI & CHAAT CORNER
// =============================================================================
function buildPaniPuriShop(ctx) {
  const shop = new THREE.Group();

  const signTex = createSignboardTexture(
    '🥣 PANI PURI & CHAAT',
    'Teekha-Meetha Pani & Dahi Papdi Chaat',
    '#1a2a1a',
    '#f4a261',
    '#52b788'
  );

  const stall = buildStallShell({
    counterColor: 0x3d271d,
    backWallColor: 0x5a3d2e,
    canopyColorA: 0xf4a261, // Indian festive saffron & teal
    canopyColorB: 0x2a9d8f,
    signTexture: signTex,
    chalkMenuText: "CHAAT CHATORI\n• Golgappe (6 pcs)\n• Dahi Papdi Chaat\n• Sev Puri & Bhel\nKuchii's Favorite! ✨"
  });
  shop.add(stall);

  // --- Glass Jar of Crispy Hollow Puris ---
  const puriJar = new THREE.Group();
  puriJar.position.set(-0.75, 1.07, 0.45);
  shop.add(puriJar);

  const jarGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.32, 0.45, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.08,
      metalness: 0.1
    })
  );
  jarGlass.position.y = 0.225;
  puriJar.add(jarGlass);

  // Pile of crispy golden round puris (spheres)
  const puriMat = new THREE.MeshStandardMaterial({ color: 0xdca158, roughness: 0.7 });
  for (let i = 0; i < 18; i++) {
    const puri = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), puriMat);
    puri.scale.set(1, 0.88, 1);
    const pAngle = (i / 18) * Math.PI * 2;
    const r = (i < 10 ? 0.22 : 0.12);
    puri.position.set(Math.sin(pAngle) * r, 0.1 + (i > 9 ? 0.18 : 0.06), Math.cos(pAngle) * r);
    puriJar.add(puri);
  }

  // --- Terracotta Matka Clay Pots (Mint Pani & Tamarind Sonth) ---
  // Pot 1: Spicy green teekha mint pani
  const greenPot = createClayMatka(0x2d6a4f);
  greenPot.position.set(0.05, 1.07, 0.45);
  shop.add(greenPot);

  // Pot 2: Sweet tangy tamarind sonth chutney
  const sweetPot = createClayMatka(0x6b3017);
  sweetPot.position.set(0.65, 1.07, 0.45);
  shop.add(sweetPot);

  // --- Serving Plate: Ready-to-eat Dahi Papdi Chaat ---
  const chaatPlate = new THREE.Group();
  chaatPlate.position.set(-0.25, 1.07, 0.45);
  shop.add(chaatPlate);

  const plateMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.03, 16), MAT.sandstone);
  plateMesh.position.y = 0.015;
  chaatPlate.add(plateMesh);

  // Dahi dollops, crispy papdis & red pomegranate garnish
  const dahiMat = new THREE.MeshStandardMaterial({ color: 0xfffcf2, roughness: 0.25 });
  const sevMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7 });
  const pomMat = new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.2 });

  const dahi = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 14), dahiMat);
  dahi.position.y = 0.04;
  chaatPlate.add(dahi);

  const sev = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12), sevMat);
  sev.position.y = 0.065;
  chaatPlate.add(sev);

  // Pomegranate seeds
  for (let i = 0; i < 8; i++) {
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), pomMat);
    pom.position.set((Math.random() - 0.5) * 0.24, 0.08, (Math.random() - 0.5) * 0.24);
    chaatPlate.add(pom);
  }

  // Steel bowl with chopped onions & fresh coriander
  const onionBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.12, 12), MAT.metal);
  onionBowl.position.set(1.15, 1.13, 0.4);
  shop.add(onionBowl);

  const herbMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });
  const coriander = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), herbMat);
  coriander.position.set(1.15, 1.18, 0.4);
  shop.add(coriander);

  return shop;
}

// =============================================================================
// SHOP 3: ARTISAN BAKERY & CHEESECAKE PATISSERIE
// =============================================================================
function buildBakeryShop(ctx) {
  const shop = new THREE.Group();

  const signTex = createSignboardTexture(
    '🍰 ARTISAN BAKERY',
    'Strawberry Cheesecake & French Pastries',
    '#2b1b22',
    '#ffccd5',
    '#ff758f'
  );

  const stall = buildStallShell({
    counterColor: 0xfdfbf7, // Chic ivory white
    backWallColor: 0x4a3b42,
    canopyColorA: 0xf7cad0, // Soft blush pink & warm cream
    canopyColorB: 0xfff0f3,
    signTexture: signTex,
    chalkMenuText: "PATISSERIE MENU\n• NY Strawberry Cake\n• Butter Croissants\n• Velvet Berry Cupcake\nBaked with Love 🍰"
  });
  shop.add(stall);

  // --- Glass Pastry Display Showcase ---
  const caseGroup = new THREE.Group();
  caseGroup.position.set(0, 1.07, 0.45);
  shop.add(caseGroup);

  const caseGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.04,
      metalness: 0.1
    })
  );
  caseGlass.position.y = 0.3;
  caseGroup.add(caseGlass);

  const caseFrame = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.04, 0.84), MAT.gold);
  caseFrame.position.y = 0.6;
  caseGroup.add(caseFrame);

  // --- The Star: New York Cheesecake with Sliced Cutout & Strawberry Glaze ---
  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(-0.55, 0.04, 0);
  caseGroup.add(cakeGroup);

  const cakeBoard = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 24), MAT.gold);
  cakeBoard.position.y = 0.01;
  cakeGroup.add(cakeBoard);

  // Graham cracker crust
  const crustMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.85 });
  const crust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.04, 24, 1, false, 0, Math.PI * 1.7),
    crustMat
  );
  crust.position.y = 0.03;
  cakeGroup.add(crust);

  // Velvety cream cheesecake filling
  const fillingMat = new THREE.MeshStandardMaterial({ color: 0xfffaed, roughness: 0.28 });
  const filling = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.15, 24, 1, false, 0, Math.PI * 1.7),
    fillingMat
  );
  filling.position.y = 0.115;
  cakeGroup.add(filling);

  // Ruby red strawberry glaze on top
  const glazeMat = new THREE.MeshStandardMaterial({ color: 0xc9184a, roughness: 0.18, metalness: 0.1 });
  const glaze = new THREE.Mesh(
    new THREE.CylinderGeometry(0.332, 0.332, 0.025, 24, 1, false, 0, Math.PI * 1.7),
    glazeMat
  );
  glaze.position.y = 0.195;
  cakeGroup.add(glaze);

  // Fresh ripe strawberry halves on top
  for (let i = 0; i < 6; i++) {
    const berry = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 8), glazeMat);
    berry.rotation.x = Math.PI / 2;
    const bAngle = 0.25 + (i / 6) * (Math.PI * 1.45);
    berry.position.set(Math.sin(bAngle) * 0.2, 0.22, Math.cos(bAngle) * 0.2);
    cakeGroup.add(berry);
  }

  // The Cut-Out Single Slice placed on a dessert plate beside the cake!
  const slicePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.02, 16), MAT.white);
  slicePlate.position.set(0.3, 0.02, 0);
  caseGroup.add(slicePlate);

  const slice = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.15, 8, 1, false, Math.PI * 1.75, 0.48),
    fillingMat
  );
  slice.position.set(0.3, 0.1, 0);
  caseGroup.add(slice);

  // Strawberry topping on the single slice
  const sliceBerry = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 8), glazeMat);
  sliceBerry.rotation.x = Math.PI / 2;
  sliceBerry.position.set(0.35, 0.19, 0);
  caseGroup.add(sliceBerry);

  // Tiny gold dessert fork
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.03), MAT.gold);
  fork.position.set(0.42, 0.03, -0.1);
  fork.rotation.y = 0.4;
  caseGroup.add(fork);

  // Flaky golden croissants on a tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.38), MAT.metal);
  tray.position.set(0.85, 0.02, 0);
  caseGroup.add(tray);

  const croissantMat = new THREE.MeshStandardMaterial({ color: 0xde9b52, roughness: 0.5 });
  for (let i = 0; i < 2; i++) {
    const croissant = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.045, 8, 14, Math.PI * 0.8), croissantMat);
    croissant.rotation.x = Math.PI / 2;
    croissant.position.set(0.77 + i * 0.17, 0.07, 0);
    caseGroup.add(croissant);
  }

  // Warm glowing interior bakery light
  const bakeryLight = new THREE.PointLight(0xffecd1, 5, 6, 2);
  bakeryLight.position.set(0, 1.45, 0.45);
  shop.add(bakeryLight);

  return shop;
}

// =============================================================================
// SHOP 4: CRISPY & GRILLED CHICKEN SHOP
// =============================================================================
function buildChickenShop(ctx) {
  const shop = new THREE.Group();

  const signTex = createSignboardTexture(
    '🍗 CRISPY CHICKEN',
    'Crunchy Tenders, Tandoori Tikka & Dips',
    '#241412',
    '#ff4d6d',
    '#ffb703'
  );

  const stall = buildStallShell({
    counterColor: 0x331e17,
    backWallColor: 0x543226,
    canopyColorA: 0xd90429, // Bold red & black
    canopyColorB: 0x222222,
    signTexture: signTex,
    chalkMenuText: "GRILL & ROAST\n• Crispy Fried Bucket\n• Tandoori Tikka (3x)\n• Peri-Peri / Garlic Dips\nHot & Sizzling 🔥"
  });
  shop.add(stall);

  // --- Big Red-and-White Striped Bucket of Fried Chicken Drumsticks ---
  const bucketGroup = new THREE.Group();
  bucketGroup.position.set(-0.65, 1.07, 0.45);
  shop.add(bucketGroup);

  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.35, 18),
    new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.45 })
  );
  bucket.position.y = 0.175;
  bucket.castShadow = true;
  bucketGroup.add(bucket);

  const bucketRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 18), MAT.white);
  bucketRim.rotation.x = Math.PI / 2;
  bucketRim.position.y = 0.35;
  bucketGroup.add(bucketRim);

  // White stripe wrap on bucket
  const stripeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.252, 0.245, 0.09, 18),
    MAT.white
  );
  stripeMesh.position.y = 0.18;
  bucketGroup.add(stripeMesh);

  // Crispy textured golden drumsticks & tenders overflowing from bucket
  const chickenMat = new THREE.MeshStandardMaterial({ color: 0xb86b24, roughness: 0.95 });
  for (let i = 0; i < 8; i++) {
    const piece = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.13, 5, 8), chickenMat);
    const bAngle = (i / 8) * Math.PI * 2;
    piece.position.set(Math.sin(bAngle) * 0.15, 0.38 + Math.sin(i * 2) * 0.03, Math.cos(bAngle) * 0.15);
    piece.rotation.set(0.35, bAngle, 0.25);
    piece.castShadow = true;
    bucketGroup.add(piece);
  }

  // --- Sizzling Grill Plate with Grilled Skewers ---
  const grillGroup = new THREE.Group();
  grillGroup.position.set(0.2, 1.07, 0.45);
  shop.add(grillGroup);

  const grillPlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.5), tinted(MAT.metal, 0x1a1a1a));
  grillPlate.position.y = 0.02;
  grillGroup.add(grillPlate);

  // Sizzling skewers (tandoori red chicken tikka cubes on skewers)
  const tikkaMat = new THREE.MeshStandardMaterial({ color: 0xd00000, roughness: 0.8 });
  const capsicumMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.5 });
  const skewerMat = new THREE.MeshStandardMaterial({ color: 0xdcb463, roughness: 0.4 });

  for (let s = 0; s < 3; s++) {
    const skewerZ = -0.14 + s * 0.14;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 6), skewerMat);
    stick.rotation.z = Math.PI / 2;
    stick.position.set(0, 0.06, skewerZ);
    grillGroup.add(stick);

    // Grilled chicken cubes and green capsicums per skewer
    for (let c = 0; c < 4; c++) {
      const mat = (c === 2 ? capsicumMat : tikkaMat);
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.085, 0.085), mat);
      cube.position.set(-0.2 + c * 0.12, 0.06, skewerZ);
      cube.rotation.y = (c % 2) * 0.3;
      grillGroup.add(cube);
    }
  }

  // Dip bowls (Garlic Mayo, Spicy Peri-Peri, Honey BBQ)
  const mayo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.06, 10), MAT.white);
  mayo.position.set(0.85, 1.1, 0.38);
  shop.add(mayo);

  const periPeri = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.06, 10), tinted(MAT.metal, 0xd00000));
  periPeri.position.set(1.05, 1.1, 0.38);
  shop.add(periPeri);

  const bbq = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.06, 10), tinted(MAT.metal, 0x4a1e12));
  bbq.position.set(1.25, 1.1, 0.38);
  shop.add(bbq);

  // Warm food heat lamp glow
  const heatLamp = new THREE.PointLight(0xff6a00, 5, 6, 2);
  heatLamp.position.set(0, 1.55, 0.45);
  shop.add(heatLamp);

  return shop;
}

// =============================================================================
// REUSABLE STALL ARCHITECTURE & HELPERS
// =============================================================================
function buildStallShell({ counterColor, backWallColor, canopyColorA, canopyColorB, signTexture, chalkMenuText }) {
  const stall = new THREE.Group();

  // Solid wooden counter
  const counterMat = new THREE.MeshStandardMaterial({ color: counterColor, roughness: 0.65 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 1.2), counterMat);
  counter.position.set(0, 0.525, 0.5);
  counter.castShadow = true;
  counter.receiveShadow = true;
  stall.add(counter);

  // Countertop wooden overhang slab
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.72, 0.08, 1.32), MAT.plank);
  counterTop.position.set(0, 1.04, 0.5);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  stall.add(counterTop);

  // Warm Back Wall with plank texture
  const backMat = new THREE.MeshStandardMaterial({ color: backWallColor, roughness: 0.75 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 0.15), backMat);
  back.position.set(0, 1.4, -0.6);
  back.castShadow = true;
  back.receiveShadow = true;
  stall.add(back);

  // Back Wall Shelf with condiment tins & jars
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.28), MAT.plank);
  shelf.position.set(0, 1.9, -0.48);
  shelf.castShadow = true;
  stall.add(shelf);

  // Cute ceramic spice jars and bottles on the back shelf
  const jarColors = [0xe9c46a, 0xe76f51, 0x2a9d8f, 0xf4a261, 0xffffff];
  for (let j = 0; j < 5; j++) {
    const jarMat = new THREE.MeshStandardMaterial({ color: jarColors[j], roughness: 0.4 });
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), jarMat);
    jar.position.set(-1.1 + j * 0.55, 2.01, -0.48);
    stall.add(jar);
  }

  // Wooden corner posts
  const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.9, 8);
  for (const px of [-1.72, 1.72]) {
    for (const pz of [-0.55, 0.95]) {
      const post = new THREE.Mesh(postGeo, MAT.darkWood);
      post.position.set(px, 1.45, pz);
      post.castShadow = true;
      stall.add(post);
    }
  }

  // Striped Canopy
  const canopyMatA = new THREE.MeshStandardMaterial({ color: canopyColorA, roughness: 0.65 });
  const canopyMatB = new THREE.MeshStandardMaterial({ color: canopyColorB, roughness: 0.65 });
  const stripes = 8;
  const stripeW = 3.8 / stripes;

  for (let i = 0; i < stripes; i++) {
    const mat = i % 2 === 0 ? canopyMatA : canopyMatB;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeW, 0.08, 1.7), mat);
    stripe.position.set(-1.9 + stripeW * (i + 0.5), 2.85, 0.2);
    stripe.rotation.x = -0.14;
    stripe.castShadow = true;
    stall.add(stripe);
  }

  // Overhead Signboard with Custom Canvas Art
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.68, 0.08), MAT.darkWood);
  signBack.position.set(0, 3.15, 1.05);
  signBack.castShadow = true;
  stall.add(signBack);

  const signBorder = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.74, 0.06), MAT.gold);
  signBorder.position.copy(signBack.position);
  stall.add(signBorder);

  if (signTexture) {
    const signFront = new THREE.Mesh(
      new THREE.PlaneGeometry(2.62, 0.6),
      new THREE.MeshStandardMaterial({
        map: signTexture,
        roughness: 0.35,
        metalness: 0.05
      })
    );
    signFront.position.set(0, 3.15, 1.10);
    stall.add(signFront);
  }

  // Side chalkboard menu
  if (chalkMenuText) {
    const chalkTex = createChalkboardTexture(chalkMenuText);
    const chalkMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 1.25),
      new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.8 })
    );
    chalkMesh.position.set(1.73, 1.45, 0.2);
    chalkMesh.rotation.y = Math.PI / 2;
    stall.add(chalkMesh);
  }

  // Warm overhead stall lamp
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), MAT.lampGlow);
  lamp.position.set(0, 2.65, 0.5);
  stall.add(lamp);

  const stallSpot = new THREE.PointLight(0xffd166, 3, 5, 2);
  stallSpot.position.set(0, 2.5, 0.5);
  stall.add(stallSpot);

  return stall;
}

/**
 * Procedural Signboard Texture Generator.
 */
function createSignboardTexture(title, subtitle, bgColor, primaryColor, accentColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Outer border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 496, 112);

  // Inner subtle border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, 482, 98);

  // Title
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 34px "Cinzel", "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 50);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = accentColor;
    ctx.font = '500 17px "Quicksand", "Segoe UI", sans-serif';
    ctx.fillText(subtitle, 256, 88);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Chalkboard Menu Texture Generator.
 */
function createChalkboardTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // Slate blackboard
  ctx.fillStyle = '#1e2421';
  ctx.fillRect(0, 0, 256, 384);

  // Border
  ctx.strokeStyle = '#8d99ae';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 372);

  // Lines
  const lines = text.split('\n');
  ctx.fillStyle = '#f8f9fa';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  lines.forEach((line, idx) => {
    if (idx === 0) {
      ctx.font = 'bold 18px "Caveat", cursive, sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(line, 128, 40);
    } else {
      ctx.font = '14px "Caveat", cursive, sans-serif';
      ctx.fillStyle = '#f8f9fa';
      ctx.fillText(line, 128, 70 + idx * 30);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildPicnicTable({ withBurgerFeast, withDessertFeast } = {}) {
  const table = new THREE.Group();

  // Tabletop
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.4), MAT.plank);
  tableTop.position.y = 0.86;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  table.add(tableTop);

  // Legs & support braces
  const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
  for (const lx of [-1.05, 1.05]) {
    for (const lz of [-0.55, 0.55]) {
      const leg = new THREE.Mesh(legGeo, MAT.darkWood);
      leg.position.set(lx, 0.43, lz);
      leg.castShadow = true;
      table.add(leg);
    }
  }

  // Two Benches
  const benchGeo = new THREE.BoxGeometry(2.6, 0.08, 0.4);
  for (const bz of [-1.05, 1.05]) {
    const bench = new THREE.Mesh(benchGeo, MAT.plank);
    bench.position.set(0, 0.48, bz);
    bench.castShadow = true;
    bench.receiveShadow = true;
    table.add(bench);

    // Bench legs
    for (const lx of [-1.05, 1.05]) {
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.47, 0.08), MAT.darkWood);
      bLeg.position.set(lx, 0.24, bz);
      bLeg.castShadow = true;
      table.add(bLeg);
    }
  }

  // Candles in glass jars on tabletop
  const candleJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.1 })
  );
  candleJar.position.set(-0.6, 0.99, 0);
  table.add(candleJar);

  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff3b0, roughness: 0.5 })
  );
  candle.position.set(-0.6, 0.96, 0);
  table.add(candle);

  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), MAT.lampGlow);
  flame.position.set(-0.6, 1.04, 0);
  table.add(flame);

  const candleGlow = new THREE.PointLight(0xffa200, 1.2, 3.5, 2);
  candleGlow.position.set(-0.6, 1.05, 0);
  table.add(candleGlow);

  // Feast Items on Tabletop
  if (withBurgerFeast) {
    // Mini wooden tray with burger & fry box
    const feastTray = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.45), MAT.darkWood);
    feastTray.position.set(0.3, 0.92, 0);
    table.add(feastTray);

    const miniBurger = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), tinted(MAT.sandstone, 0xd49b55));
    miniBurger.position.set(0.15, 0.98, 0);
    table.add(miniBurger);

    const drink1 = createSodaCup();
    drink1.position.set(0.48, 0.91, 0.1);
    table.add(drink1);
  }

  if (withDessertFeast) {
    // Dessert plate with cheesecake slice
    const dessertPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.02, 14), MAT.white);
    dessertPlate.position.set(0.2, 0.92, 0);
    table.add(dessertPlate);

    const slice = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.08, 5), tinted(MAT.sandstone, 0xfff6ea));
    slice.position.set(0.2, 0.96, 0);
    table.add(slice);

    const mugMat = new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.3 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), mugMat);
    mug.position.set(0.55, 0.97, 0.12);
    table.add(mug);
  }

  return table;
}

function buildFlowerPlanter() {
  const planter = new THREE.Group();

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.1), MAT.darkWood);
  box.position.y = 0.225;
  box.castShadow = true;
  box.receiveShadow = true;
  planter.add(box);

  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 1.02), MAT.soil);
  soil.position.y = 0.43;
  planter.add(soil);

  // Colorful blooming flower clusters
  const flowerColors = [0xff758f, 0xffb703, 0x48cae4, 0xffccd5];
  for (let i = 0; i < 9; i++) {
    const col = flowerColors[i % flowerColors.length];
    const flMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), flMat);
    flower.position.set(
      ((i % 3) - 1) * 0.3 + (Math.random() - 0.5) * 0.05,
      0.54 + Math.random() * 0.06,
      (Math.floor(i / 3) - 1) * 0.3 + (Math.random() - 0.5) * 0.05
    );
    planter.add(flower);
  }

  return planter;
}

function createCondimentBottle(material) {
  const bottle = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), material);
  body.position.y = 0.11;
  bottle.add(body);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 8), MAT.white);
  cap.position.y = 0.26;
  bottle.add(cap);

  return bottle;
}

function createSodaCup() {
  const cup = new THREE.Group();

  const cupMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.22, 12), cupMat);
  body.position.y = 0.11;
  cup.add(body);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12), MAT.white);
  lid.position.y = 0.22;
  cup.add(lid);

  // Straw
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), strawMat);
  straw.position.set(0.02, 0.27, 0);
  straw.rotation.z = -0.25;
  cup.add(straw);

  return cup;
}

function createClayMatka(waterColor) {
  const matka = new THREE.Group();

  const clayMat = new THREE.MeshStandardMaterial({ color: 0xb55a30, roughness: 0.85 });

  // Bulbous pot belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), clayMat);
  belly.position.y = 0.24;
  belly.scale.set(1, 0.9, 1);
  matka.add(belly);

  // Pot rim / mouth
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), clayMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.42;
  matka.add(rim);

  // Water inside pot
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.02, 14),
    new THREE.MeshStandardMaterial({ color: waterColor, roughness: 0.15, transparent: true, opacity: 0.85 })
  );
  water.position.y = 0.38;
  matka.add(water);

  // Metal ladle handle sticking out
  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), MAT.metal);
  ladle.position.set(0.04, 0.48, 0);
  ladle.rotation.z = 0.35;
  matka.add(ladle);

  return matka;
}

// =============================================================================
// INTERACTION & SURPRISE REGISTRATION
// =============================================================================
function registerFoodSurprises(ctx, group) {
  // 1. Burger Shop Surprise (trigger placed at customer standing area in front of counter)
  const burgerWorld = ctx.localToWorld(group, -4.5, -4.2);
  ctx.interactions.register({
    id: 'food_burger',
    x: burgerWorld.x,
    z: burgerWorld.z,
    radius: 2.5,
    label: 'Order Gourmet Burger & Crispy Fries',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'food_burger' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // 2. Pani Puri & Chaat Surprise (trigger placed at customer standing area in front of counter)
  const chaatWorld = ctx.localToWorld(group, -4.5, 4.2);
  ctx.interactions.register({
    id: 'food_panipuri',
    x: chaatWorld.x,
    z: chaatWorld.z,
    radius: 2.5,
    label: 'Take the Pani Puri & Chaat Challenge',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'food_panipuri' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // 3. Bakery & Cheesecake Surprise (trigger placed at customer standing area in front of counter)
  const bakeryWorld = ctx.localToWorld(group, 4.5, -4.2);
  ctx.interactions.register({
    id: 'food_cheesecake',
    x: bakeryWorld.x,
    z: bakeryWorld.z,
    radius: 2.5,
    label: 'Taste New York Strawberry Cheesecake',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'food_cheesecake' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // 4. Crispy Chicken Surprise (trigger placed at customer standing area in front of counter)
  const chickenWorld = ctx.localToWorld(group, 4.5, 4.2);
  ctx.interactions.register({
    id: 'food_chicken',
    x: chickenWorld.x,
    z: chickenWorld.z,
    radius: 2.5,
    label: 'Feast on Crispy & Sizzling Chicken',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'food_chicken' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });
}
