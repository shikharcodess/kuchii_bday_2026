import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createFenceRun, createBench } from '../Props.js';
import { Pond } from '../Pond.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 2 — the Sunflower Garden, the koi pond, and the "getting ready"
 * corner.
 *
 * The flowers are deliberately sparse: a border along the road rather than a
 * wall of them, so she can see through the garden to the pond and the arch.
 * The pond is the centrepiece — a bench on a small deck at the water's edge is
 * a place to actually stop, sit, and watch the fish.
 */
export function buildSunflowerGarden(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(2210);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  ctx.scene.add(group);

  const pondCenter = { x: x + 15, z: z + 3 };
  const patioCenter = { x: x - 12, z: z - 4 };

  // --- Sunflowers: a scattered border, not a field ---
  const field = ctx.fields.sunflowers;
  const startT = ctx.paths.tNearest(x, z + 9);
  const endT = ctx.paths.tNearest(x, z - 9);
  const spot = new THREE.Vector3();

  const clearOfFeatures = (px, pz) =>
    Math.hypot(px - pondCenter.x, pz - pondCenter.z) > 8 &&
    Math.hypot(px - patioCenter.x, pz - patioCenter.z) > 4.5;

  for (let i = 0; i < 65; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    // Held back from the road edge so the verge stays clear and walkable
    const lateral = side * (4.2 + rand() * 9);
    ctx.paths.offsetAt(t, lateral, spot);

    if (!clearOfFeatures(spot.x, spot.z)) continue;

    field.add(spot.x, spot.z, {
      scale: 0.82 + rand() * 0.3,
      rotY: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 0.16
    });
  }

  // A looser drift of them behind the pond, catching the light
  for (let i = 0; i < 26; i++) {
    const angle = -0.7 + rand() * 1.9;
    const dist = 9 + rand() * 6;
    field.add(
      pondCenter.x + Math.sin(angle) * dist,
      pondCenter.z - Math.cos(angle) * dist,
      { scale: 0.85 + rand() * 0.35, rotY: rand() * Math.PI * 2 }
    );
  }

  // --- Roses, Lavender & Cosmos: rich floral diversity ---
  if (ctx.fields.roses) {
    for (let i = 0; i < 28; i++) {
      const t = startT + (endT - startT) * rand();
      const lateral = (rand() < 0.5 ? -1 : 1) * (2.8 + rand() * 4.5);
      ctx.paths.offsetAt(t, lateral, spot);
      if (clearOfFeatures(spot.x, spot.z)) {
        ctx.fields.roses.add(spot.x, spot.z, { scale: 0.85 + rand() * 0.35, rotY: rand() * Math.PI * 2 });
      }
    }
  }

  if (ctx.fields.lavender) {
    for (let i = 0; i < 35; i++) {
      const t = startT + (endT - startT) * rand();
      const lateral = (rand() < 0.5 ? -1 : 1) * (2.2 + rand() * 3.2);
      ctx.paths.offsetAt(t, lateral, spot);
      if (clearOfFeatures(spot.x, spot.z)) {
        ctx.fields.lavender.add(spot.x, spot.z, { scale: 0.9 + rand() * 0.3, rotY: rand() * Math.PI * 2 });
      }
    }
  }

  if (ctx.fields.cosmos) {
    for (let i = 0; i < 30; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 7.5 + rand() * 5.5;
      const cx = pondCenter.x + Math.sin(angle) * dist;
      const cz = pondCenter.z + Math.cos(angle) * dist;
      if (Math.hypot(cx - pondCenter.x, cz - pondCenter.z) > 7.2) {
        ctx.fields.cosmos.add(cx, cz, { scale: 0.85 + rand() * 0.4, rotY: rand() * Math.PI * 2 });
      }
    }
  }

  // --- The pond ---
  const pond = new Pond({ x: pondCenter.x, z: pondCenter.z, radius: 6.5 });
  pond.addTo(ctx.scene);
  ctx.addHole(pond.hole);
  ctx.registerAnimated((time, dt) => pond.update(time, dt));

  // Protect player from falling into deep water, but keep the deck entrance wide open
  const ringCount = 20;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    // Deck is located at deckAngle = Math.PI * 1.5 (west); keep entry gate clear
    const diffToDeck = Math.atan2(Math.sin(angle - Math.PI * 1.5), Math.cos(angle - Math.PI * 1.5));
    if (Math.abs(diffToDeck) < 0.55) continue;

    ctx.addCircle(
      pondCenter.x + Math.sin(angle) * (pond.radius + 0.5),
      pondCenter.z + Math.cos(angle) * (pond.radius + 0.5),
      1.3
    );
  }

  // --- Deck and bench at the water's edge, facing the fish ---
  const deckAngle = Math.PI * 1.5; // the road side of the pond (west)
  const deckX = pondCenter.x + Math.sin(deckAngle) * (pond.radius - 0.6);
  const deckZ = pondCenter.z + Math.cos(deckAngle) * (pond.radius - 0.6);
  const facing = Math.atan2(pondCenter.x - deckX, pondCenter.z - deckZ);

  const deck = new THREE.Group();
  deck.position.set(deckX, 0, deckZ);
  deck.rotation.y = facing;
  ctx.scene.add(deck);

  const deckTop = 0.18;
  const boards = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.2, 4.4), MAT.plank);
  boards.position.set(0, deckTop - 0.1, 0.6);
  boards.receiveShadow = true;
  boards.castShadow = true;
  deck.add(boards);

  for (let i = 0; i < 9; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 4.4), MAT.wood);
    board.position.set(-2.34 + i * 0.585, deckTop + 0.01, 0.6);
    board.receiveShadow = true;
    deck.add(board);
  }

  // Posts holding the deck out over the water
  for (const [px, pz] of [[-2.3, 2.5], [2.3, 2.5]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 8), MAT.darkWood);
    post.position.set(px, -0.6, pz);
    post.castShadow = true;
    deck.add(post);
  }

  // Bench, set back on the deck and turned to look across the water
  // The deck's local +Z points at the water, and createBench faces +Z, so the
  // bench needs no rotation: its back is to the road, its seat to the pond.
  const bench = createBench();
  bench.position.set(0, deckTop, -0.6);
  deck.add(bench);

  // Where she actually sits. The pelvis drops half a unit in the seated pose,
  // so the root sits that much below the bench surface.
  const seatWorld = ctx.localToWorld(deck, 0, -0.52);
  const seat = {
    x: seatWorld.x,
    z: seatWorld.z,
    // The pelvis drops half a unit in the seated pose, so the root sits that
    // far below the bench surface.
    y: deckTop + 0.72 - 0.54,
    yaw: facing
  };

  // Railing / edge colliders protecting water boundaries while leaving deck and seat fully accessible
  const leftEdge = ctx.localToWorld(deck, -2.6, 1.0);
  const rightEdge = ctx.localToWorld(deck, 2.6, 1.0);
  const waterFront = ctx.localToWorld(deck, 0, 2.8);
  ctx.addCircle(leftEdge.x, leftEdge.z, 0.7);
  ctx.addCircle(rightEdge.x, rightEdge.z, 0.7);
  ctx.addCircle(waterFront.x, waterFront.z, 0.9);
  // Behind the bench backrest so player cannot walk through back of bench
  const benchBack = ctx.localToWorld(deck, 0, -1.1);
  ctx.addCircle(benchBack.x, benchBack.z, 0.45);

  // A watering can and a pair of terracotta pots, so the deck looks lived-in
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.36, 14), MAT.copper);
  pot.position.set(2, deckTop + 0.18, 0.3);
  pot.castShadow = true;
  deck.add(pot);

  const potPlant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), MAT.leafWarm);
  potPlant.position.set(2, deckTop + 0.5, 0.3);
  potPlant.castShadow = true;
  deck.add(potPlant);

  ctx.interactions.register({
    id: 'pond_bench',
    x: seatWorld.x,
    z: seatWorld.z,
    radius: 3.4,
    label: 'Sit and watch the fish',
    activeLabel: 'Get up',
    onEnter: (character) => {
      character.sitOn(seat);
      ctx.camera.beginOrbit({
        x: pondCenter.x,
        z: pondCenter.z,
        radius: pond.radius + 7.5,
        height: 5.2,
        lookHeight: 0.2,
        speed: 0.15
      });
    },
    onExit: (character) => {
      character.standUp();
      ctx.camera.endOrbit();
    }
  });

  // --- Rose trellis arch spanning the road ---
  const archT = ctx.paths.tNearest(x, z + 15);
  const archSpot = ctx.paths.pointAt(archT, new THREE.Vector3());
  const archHeading = ctx.paths.headingAt(archT);

  const arch = new THREE.Group();
  arch.position.set(archSpot.x, 0, archSpot.z);
  arch.rotation.y = archHeading;

  const archPostGeo = new THREE.CylinderGeometry(0.11, 0.13, 3.2, 8);
  for (const side of [-2.9, 2.9]) {
    const post = new THREE.Mesh(archPostGeo, MAT.plank);
    post.position.set(side, 1.6, 0);
    post.castShadow = true;
    arch.add(post);
    const world = new THREE.Vector3(side, 0, 0).applyAxisAngle(UP, archHeading).add(archSpot);
    ctx.addCircle(world.x, world.z, 0.4);
  }

  const archTop = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.11, 8, 20, Math.PI),
    MAT.plank
  );
  archTop.position.y = 3.2;
  archTop.castShadow = true;
  arch.add(archTop);

  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const angle = Math.PI * t;
    const rose = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.13 + rand() * 0.08, 0),
      rand() < 0.35 ? MAT.rose : MAT.leafWarm
    );
    rose.position.set(
      Math.cos(angle) * 2.9,
      3.2 + Math.sin(angle) * 2.9,
      (rand() - 0.5) * 0.4
    );
    rose.castShadow = true;
    arch.add(rose);
  }
  ctx.scene.add(arch);

  // --- "Getting ready" patio, off the west side of the path ---
  const patio = new THREE.Group();
  patio.position.set(patioCenter.x, 0, patioCenter.z);
  patio.rotation.y = Math.PI / 2.6;
  ctx.scene.add(patio);

  const deckStone = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.3, 0.22, 24),
    MAT.sandstone
  );
  deckStone.position.y = 0.11;
  deckStone.receiveShadow = true;
  patio.add(deckStone);

  buildVanity(patio, ctx);
  buildJewelleryStand(patio);

  const patioLight = new THREE.PointLight(0xffd2b0, 7, 12, 2);
  patioLight.position.set(0, 2.6, 0);
  patio.add(patioLight);

  // Collider only at the table rear so player can freely walk across the patio
  const tableWorld = ctx.localToWorld(patio, 0, -1.8);
  ctx.addCircle(tableWorld.x, tableWorld.z, 0.75);

  // Register interactive surprise at the vanity
  ctx.interactions.register({
    id: 'sunflower_sparkle',
    x: patioCenter.x,
    z: patioCenter.z,
    radius: 3.5,
    label: 'Explore Dressing & Jewelry Corner ✨',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'sunflower_sparkle' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  // --- Surroundings ---
  ctx.scene.add(createFenceRun(x - 20, z - 24, x - 7, z - 24));

  for (let i = 0; i < 22; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    ctx.paths.offsetAt(t, side * (3.2 + rand() * 12), spot);
    if (!clearOfFeatures(spot.x, spot.z)) continue;
    ctx.fields.grass.add(spot.x, spot.z, {
      scale: 0.8 + rand() * 0.7,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x - 21, z - 14, { scale: 1.15, rotY: 1.2 });
  ctx.fields.trees.add(x + 26, z - 12, { scale: 1.05, rotY: 0.2 });
  ctx.addCircle(x - 21, z - 14, 0.9);
  ctx.addCircle(x + 26, z - 12, 0.9);

  return group;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Vanity table: mirror, palette, brushes and a star-capped polish bottle. */
function buildVanity(patio, ctx) {
  const vanity = new THREE.Group();
  vanity.position.set(0, 0.22, -1.8);
  patio.add(vanity);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.95), MAT.white);
  tableTop.position.y = 0.9;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  vanity.add(tableTop);

  const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.9, 8);
  for (const [lx, lz] of [[-1.05, -0.32], [1.05, -0.32], [-1.05, 0.32], [1.05, 0.32]]) {
    const leg = new THREE.Mesh(legGeo, MAT.gold);
    leg.position.set(lx, 0.45, lz);
    leg.castShadow = true;
    vanity.add(leg);
  }

  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 12, 30), MAT.gold);
  mirrorFrame.position.set(0, 1.78, -0.28);
  mirrorFrame.castShadow = true;
  vanity.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.66, 30),
    new THREE.MeshStandardMaterial({
      color: 0xd7e2e8,
      roughness: 0.04,
      metalness: 1,
      envMapIntensity: 1.8
    })
  );
  mirrorGlass.position.set(0, 1.78, -0.25);
  vanity.add(mirrorGlass);

  const mirrorPost = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.55, 8), MAT.gold);
  mirrorPost.position.set(0, 1.15, -0.28);
  vanity.add(mirrorPost);

  const palette = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.32), MAT.gold);
  palette.position.set(-0.7, 0.97, 0.08);
  palette.castShadow = true;
  vanity.add(palette);

  for (let i = 0; i < 3; i++) {
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12),
      tinted(MAT.sparkle, [0xf2c9a0, 0xefb0c0, 0xe8c169][i])
    );
    shade.position.set(-0.83 + i * 0.14, 1.0, 0.08);
    vanity.add(shade);
  }

  const brushCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.1, 0.26, 12),
    MAT.fabricPink
  );
  brushCup.position.set(0.8, 1.07, 0);
  brushCup.castShadow = true;
  vanity.add(brushCup);

  for (let i = 0; i < 4; i++) {
    const brush = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.42, 6),
      MAT.darkWood
    );
    brush.position.set(0.8 + (i - 1.5) * 0.04, 1.3, (i % 2) * 0.05);
    brush.rotation.z = (i - 1.5) * 0.08;
    vanity.add(brush);
  }

  // Transparent polish with a tiny gold star on the cap
  const polish = new THREE.Group();
  polish.position.set(0.18, 0.95, 0.26);
  vanity.add(polish);

  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.18, 12),
    new THREE.MeshPhysicalMaterial({
      color: 0xfdf3e6,
      roughness: 0.04,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.1,
      transparent: true,
      opacity: 0.7
    })
  );
  bottle.position.y = 0.09;
  polish.add(bottle);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10), MAT.sparkle);
  cap.position.y = 0.25;
  polish.add(cap);

  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), MAT.gold);
  star.position.y = 0.37;
  polish.add(star);

  ctx.registerAnimated((time) => {
    star.rotation.y = time * 0.9;
    star.position.y = 0.37 + Math.sin(time * 1.6) * 0.012;
  });
}

/** Jewellery stand: tiny earrings on a hoop and a delicate anklet. */
function buildJewelleryStand(patio) {
  const stand = new THREE.Group();
  stand.position.set(2.2, 0.22, 0.6);
  patio.add(stand);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.09, 16), MAT.white);
  base.position.y = 0.045;
  base.receiveShadow = true;
  stand.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.05, 8), MAT.gold);
  post.position.y = 0.6;
  post.castShadow = true;
  stand.add(post);

  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 10, 24), MAT.gold);
  hoop.position.y = 1.1;
  hoop.rotation.x = Math.PI / 2;
  stand.add(hoop);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 14), MAT.gold);
    earring.position.set(Math.cos(angle) * 0.28, 1.02, Math.sin(angle) * 0.28);
    stand.add(earring);
  }

  const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.016, 8, 24), MAT.gold);
  anklet.position.set(0, 0.68, 0.18);
  anklet.rotation.x = 0.5;
  stand.add(anklet);

  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), MAT.sparkle);
  pendant.position.set(0, 0.52, 0.3);
  stand.add(pendant);
}
