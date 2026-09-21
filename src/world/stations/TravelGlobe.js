import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createLantern, createSignpost } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 3 — the Dream Travel Globe.
 *
 * A stone plaza with a slowly turning globe at its centre, ringed by five small
 * dioramas: the Amazon, Japan, a South Indian temple, Switzerland and Paris.
 * All built from primitives — silhouettes, not branded landmarks.
 */
export function buildTravelGlobe(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(7719);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  ctx.scene.add(group);

  // --- Plaza ---
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.2, 0.24, 40), MAT.sandstone);
  plaza.position.y = 0.12;
  plaza.receiveShadow = true;
  group.add(plaza);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(10.4, 0.22, 8, 48), MAT.stone);
  ring.position.y = 0.26;
  ring.rotation.x = Math.PI / 2;
  ring.receiveShadow = true;
  group.add(ring);

  // --- Central globe on a stone pedestal ---
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 1.5, 16), MAT.stone);
  pedestal.position.y = 0.85;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  group.add(pedestal);

  const globe = new THREE.Group();
  globe.position.y = 3.4;

  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 36, 28),
    new THREE.MeshStandardMaterial({ color: 0x2f6f96, roughness: 0.35, metalness: 0.15 })
  );
  ocean.castShadow = true;
  globe.add(ocean);

  // Continent patches: flattened spheres pressed onto the surface
  const landMat = tinted(MAT.leafWarm, 0x6d8f4a, { roughness: 0.8 });
  const continents = [
    [0.4, 0.6, 0.9, 1.1, 0.6],
    [-0.9, 0.2, 1.4, 0.9, 0.75],
    [1.2, -0.7, 1.0, 0.8, 0.5],
    [-1.1, -0.9, -1.0, 1.0, 0.55],
    [0.2, 1.4, -0.9, 0.7, 0.45]
  ];
  for (const [cx, cy, cz, spread, size] of continents) {
    const dir = new THREE.Vector3(cx, cy, cz).normalize();
    const land = new THREE.Mesh(new THREE.SphereGeometry(size, 14, 12), landMat);
    land.scale.set(spread, spread * 0.8, 0.42);
    // Pushed out far enough to sit proud of the ocean sphere, not inside it
    land.position.copy(dir).multiplyScalar(1.7);
    land.lookAt(0, 0, 0);
    globe.add(land);
  }

  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 10), MAT.gold);
  axis.rotation.z = 0.4;
  globe.add(axis);

  const meridian = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.07, 8, 40), MAT.gold);
  meridian.rotation.y = Math.PI / 2;
  meridian.rotation.x = 0.4;
  globe.add(meridian);

  group.add(globe);
  group.userData.globe = ocean; // Phase 3 spins this on interaction
  group.userData.globeGroup = globe;
  ctx.addCircle(x, z, 2.2);
  // The whole globe (oceans, continents, meridian) turns as one slow piece.
  ctx.registerAnimated((time) => {
    globe.rotation.y = time * 0.12;
    globe.position.y = 3.4 + Math.sin(time * 0.8) * 0.05;
  });

  const globeLight = new THREE.PointLight(0xbfe0ff, 6, 14, 2);
  globeLight.position.set(0, 5.2, 0);
  group.add(globeLight);

  // --- Five destination dioramas around the plaza ---
  const dioramas = [
    { angle: -2.4, id: 'amazon', surpriseId: 'travel_amazon', label: 'Explore Amazon Rainforest 🦜', build: buildAmazon },
    { angle: -1.35, id: 'japan', surpriseId: 'travel_japan', label: 'Explore Japan & Cherry Blossoms 🌸', build: buildTorii },
    { angle: -0.3, id: 'south_india', surpriseId: 'travel_south_india', label: 'Explore South Indian Temples 🛕', build: buildGopuram },
    { angle: 0.75, id: 'switzerland', surpriseId: 'travel_switzerland', label: 'Explore Swiss Alps & Chalets 🏔️', build: buildAlps },
    { angle: 1.8, id: 'paris', surpriseId: 'travel_paris', label: 'Explore Paris & Eiffel Tower 🥐', build: buildEiffel }
  ];

  group.userData.dioramas = {};

  // Glowing flight paths connecting central globe to each dream destination
  const flightArcs = [];
  const arcMat = new THREE.LineBasicMaterial({
    color: 0xf6c878,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  for (const { angle, id, surpriseId, label, build } of dioramas) {
    const dx = Math.sin(angle) * 7.6;
    const dz = Math.cos(angle) * 7.6;

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.7, 14), MAT.stone);
    plinth.position.set(dx, 0.45, dz);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    const diorama = build();
    diorama.position.set(dx, 0.8, dz);
    diorama.rotation.y = angle + Math.PI;
    group.add(diorama);

    group.userData.dioramas[id] = diorama;
    ctx.addCircle(x + dx, z + dz, 1.5);

    // Elegant glowing golden flight arc from globe to diorama
    const pStart = new THREE.Vector3(0, 3.4, 0);
    const pMid = new THREE.Vector3(dx * 0.5, 4.2, dz * 0.5);
    const pEnd = new THREE.Vector3(dx, 1.5, dz);
    const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    const arcLine = new THREE.Line(arcGeo, arcMat);
    group.add(arcLine);

    // Glowing waypoint beacon over each diorama
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdf80 })
    );
    beacon.position.set(dx, 2.7, dz);
    group.add(beacon);
    flightArcs.push({ beacon, startY: 2.7 });

    // Register individual interactive discovery for this destination
    ctx.interactions.register({
      id: surpriseId,
      x: x + dx,
      z: z + dz,
      radius: 3.2,
      label,
      onEnter: () => {
        window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: surpriseId } }));
      },
      onExit: () => {
        ctx.messagePanel?.hide();
      }
    });
  }

  // Animate waypoints gently hovering
  ctx.registerAnimated((time) => {
    flightArcs.forEach((fa, i) => {
      fa.beacon.position.y = fa.startY + Math.sin(time * 3 + i * 1.2) * 0.1;
    });
  });

  // --- Lanterns and greenery around the plaza edge ---
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    const lx = x + Math.sin(angle) * 12.6;
    const lz = z + Math.cos(angle) * 12.6;
    const lantern = createLantern({ height: 3 });
    lantern.position.set(lx, 0, lz);
    ctx.scene.add(lantern);
    ctx.addCircle(lx, lz, 0.5);
  }

  for (let i = 0; i < 10; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 14 + rand() * 8;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.7 + rand() * 0.6,
      rotY: rand() * Math.PI
    });
  }

  // --- Heartfelt Wish Signboard at Paris / Eiffel Tower ---
  const eiffelSign = createSignpost({
    boardWidth: 2.1,
    boardHeight: 1.05,
    height: 1.5,
    title: "Dream Big, Kuchii ✨",
    lines: [
      "I pray ki tumhari saari dreams & wishes poori hon...",
      "Tum sab achhe se ghumo, car seekho, job mile,",
      "parents ko proud feel karao aur bohot khush raho 🧿"
    ],
    signoff: "— With you in every journey ❤️"
  });
  eiffelSign.position.set(6.2, 0.24, -3.2);
  eiffelSign.rotation.y = -1.1;
  group.add(eiffelSign);
  ctx.addCircle(x + 6.2, z - 3.2, 0.6);

  // --- Wish Signboard at Plaza Ring ---
  const wanderSign = createSignpost({
    boardWidth: 2.1,
    boardHeight: 1.05,
    height: 1.5,
    title: "Fearless & Inspiring 🌟",
    lines: [
      "I love how much you want to do for yourself.",
      "I love how fearless you are, how kind & empathetic.",
      "You are a Khubsurat Insan by heart ❤️"
    ],
    signoff: "— Forever admiring you 🧿"
  });
  wanderSign.position.set(-6.6, 0.24, 4.2);
  wanderSign.rotation.y = 2.1;
  group.add(wanderSign);
  ctx.addCircle(x - 6.6, z + 4.2, 0.6);

  // Central interactive globe overview
  ctx.interactions.register({
    id: 'travel_balloon',
    x,
    z,
    radius: 4.2,
    label: 'Spin the Adventure Globe & Chart Our World ✈️',
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'travel_balloon' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  return group;
}

/** Amazon: tall canopy trees and oversized leaves. */
function buildAmazon() {
  const g = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.14, 2.2, 7);
  for (const [tx, tz, h] of [[-0.4, -0.2, 1], [0.35, 0.25, 1.25], [0.1, -0.5, 0.85]]) {
    const trunk = new THREE.Mesh(trunkGeo, MAT.bark);
    trunk.scale.y = h;
    trunk.position.set(tx, 1.1 * h, tz);
    trunk.castShadow = true;
    g.add(trunk);

    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 * h, 1), MAT.leafDeep);
    canopy.position.set(tx, 2.2 * h, tz);
    canopy.castShadow = true;
    g.add(canopy);
  }

  // Big flat understory leaves
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), MAT.leaf);
    leaf.scale.set(1, 0.1, 1.6);
    leaf.position.set(Math.sin(i * 1.7) * 0.7, 0.2, Math.cos(i * 1.7) * 0.7);
    leaf.rotation.set(0.3, i * 1.7, 0);
    leaf.castShadow = true;
    g.add(leaf);
  }

  // A small bright bird silhouette perched in the canopy
  const bird = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.09, 0.14, 4, 8),
    tinted(MAT.sunflowerPetal, 0xe8763a)
  );
  bird.rotation.z = Math.PI / 2;
  bird.position.set(0.35, 2.9, 0.25);
  g.add(bird);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), MAT.gold);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0.35, 2.92, 0.48);
  g.add(beak);

  return g;
}

/** Japan: a simple torii gate silhouette. */
function buildTorii() {
  const g = new THREE.Group();
  const vermilion = tinted(MAT.roofTile, 0xc0392b, { roughness: 0.6 });

  const legGeo = new THREE.CylinderGeometry(0.11, 0.14, 2.2, 10);
  for (const side of [-0.75, 0.75]) {
    const leg = new THREE.Mesh(legGeo, vermilion);
    leg.position.set(side, 1.1, 0);
    leg.rotation.z = -side * 0.03;
    leg.castShadow = true;
    g.add(leg);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 0.3), vermilion);
  lintel.position.y = 2.28;
  lintel.castShadow = true;
  g.add(lintel);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 0.36), vermilion);
  topBeam.position.y = 2.6;
  topBeam.rotation.z = 0;
  topBeam.castShadow = true;
  g.add(topBeam);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.1, 0.44), MAT.darkWood);
  cap.position.y = 2.74;
  cap.castShadow = true;
  g.add(cap);

  const centerPost = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.2), vermilion);
  centerPost.position.y = 2.44;
  g.add(centerPost);

  // A couple of blossom sprigs at the base
  for (const side of [-1.2, 1.15]) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), MAT.bark);
    branch.position.set(side, 0.35, 0.3);
    g.add(branch);
    const blossom = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.28, 0),
      tinted(MAT.rose, 0xf3b6c6)
    );
    blossom.position.set(side, 0.8, 0.3);
    blossom.castShadow = true;
    g.add(blossom);
  }

  return g;
}

/** South Indian temple: a stepped gopuram silhouette. */
function buildGopuram() {
  const g = new THREE.Group();
  const stoneWarm = tinted(MAT.sandstone, 0xd9c39c);

  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const width = 2.1 - t * 1.4;
    const depth = 1.3 - t * 0.85;
    const tier = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, depth), stoneWarm);
    tier.position.y = 0.35 + i * 0.36;
    tier.castShadow = true;
    tier.receiveShadow = true;
    g.add(tier);

    // Small carved details along each tier
    const detailCount = Math.max(2, 5 - i);
    for (let d = 0; d < detailCount; d++) {
      const detail = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.2, 0.12),
        tinted(MAT.sandstone, 0xc9ae86)
      );
      detail.position.set(
        -width / 2 + 0.2 + (d * (width - 0.4)) / Math.max(1, detailCount - 1),
        0.35 + i * 0.36 + 0.24,
        depth / 2 - 0.05
      );
      g.add(detail);
    }
  }

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 1.6), stoneWarm);
  base.position.y = 0.15;
  base.receiveShadow = true;
  g.add(base);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.28, 0.5, 8), MAT.gold);
  crown.position.y = 0.35 + tiers * 0.36 + 0.1;
  crown.castShadow = true;
  g.add(crown);

  const doorway = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.1), MAT.darkWood);
  doorway.position.set(0, 0.5, 0.66);
  g.add(doorway);

  return g;
}

/** Switzerland: snow-capped peaks and a tiny chalet. */
function buildAlps() {
  const g = new THREE.Group();
  const rockMat = tinted(MAT.stone, 0x7d8288);

  const peaks = [
    [0, 0, 1.5, 2.4],
    [-1.1, -0.3, 1.0, 1.7],
    [1.0, 0.35, 0.85, 1.4]
  ];
  for (const [px, pz, radius, height] of peaks) {
    const peak = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 7), rockMat);
    peak.position.set(px, height / 2, pz);
    peak.castShadow = true;
    peak.receiveShadow = true;
    g.add(peak);

    const snow = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.42, height * 0.32, 7), MAT.white);
    snow.position.set(px, height * 0.84, pz);
    snow.castShadow = true;
    g.add(snow);
  }

  // Tiny chalet at the foot of the mountains
  const chalet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.4), MAT.wood);
  chalet.position.set(0.95, 0.17, -0.75);
  chalet.castShadow = true;
  g.add(chalet);

  const chaletRoof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 4), MAT.darkWood);
  chaletRoof.position.set(0.95, 0.46, -0.75);
  chaletRoof.rotation.y = Math.PI / 4;
  chaletRoof.castShadow = true;
  g.add(chaletRoof);

  for (let i = 0; i < 3; i++) {
    const pine = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), MAT.leafDeep);
    pine.position.set(-0.4 + i * 0.42, 0.25, -0.9);
    pine.castShadow = true;
    g.add(pine);
  }

  return g;
}

/** Paris: a mini lattice tower silhouette. */
function buildEiffel() {
  const g = new THREE.Group();
  const iron = tinted(MAT.metal, 0xa08a72, { roughness: 0.45, metalness: 0.55 });

  // Four legs leaning in toward the first deck
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const legSpread = 0.62;
  const deckAHeight = 1.35;
  const deckASpread = 0.34;

  for (const [sx, sz] of corners) {
    const bottom = new THREE.Vector3(sx * legSpread, 0, sz * legSpread);
    const top = new THREE.Vector3(sx * deckASpread, deckAHeight, sz * deckASpread);
    g.add(strut(bottom, top, 0.055, iron));
  }

  // Ground-level arches between the legs
  for (let i = 0; i < 4; i++) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 6, 14, Math.PI), iron);
    arch.position.set(
      i < 2 ? 0 : (i === 2 ? -legSpread : legSpread),
      0.42,
      i < 2 ? (i === 0 ? -legSpread : legSpread) : 0
    );
    arch.rotation.y = i < 2 ? 0 : Math.PI / 2;
    arch.castShadow = true;
    g.add(arch);
  }

  const deckA = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.07, 1.05), iron);
  deckA.position.y = deckAHeight;
  deckA.castShadow = true;
  g.add(deckA);

  // Second stage: legs continue in, tighter
  const deckBHeight = 2.5;
  const deckBSpread = 0.15;
  for (const [sx, sz] of corners) {
    const bottom = new THREE.Vector3(sx * deckASpread, deckAHeight, sz * deckASpread);
    const top = new THREE.Vector3(sx * deckBSpread, deckBHeight, sz * deckBSpread);
    g.add(strut(bottom, top, 0.04, iron));
  }

  // Cross-bracing so it reads as latticework rather than a solid cone
  for (let i = 0; i < 3; i++) {
    const y = deckAHeight + ((deckBHeight - deckAHeight) * (i + 0.5)) / 3;
    const t = (y - deckAHeight) / (deckBHeight - deckAHeight);
    const spread = deckASpread + (deckBSpread - deckASpread) * t;
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(spread * 2.1, 0.03, spread * 2.1),
      iron
    );
    brace.position.y = y;
    g.add(brace);
  }

  const deckB = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), iron);
  deckB.position.y = deckBHeight;
  deckB.castShadow = true;
  g.add(deckB);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.11, 1.1, 6), iron);
  spire.position.y = deckBHeight + 0.55;
  spire.castShadow = true;
  g.add(spire);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), MAT.lampGlow);
  beacon.position.y = deckBHeight + 1.18;
  g.add(beacon);

  return g;
}

/** A slim beam running between two points — the tower's structural members. */
function strut(from, to, radius, material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.7, radius, length, 6),
    material
  );
  mesh.position.copy(from).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  mesh.castShadow = true;
  return mesh;
}
