import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createSignpost, createLantern } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 6 — The Road That Led To Us.
 *
 * A deliberate change of pace: the road narrows, pines close in, a stream runs
 * under a small wooden bridge, and four blank signposts line the way. The
 * boards stay empty here on purpose — Phase 3 fills them with the user's own
 * words.
 */
export function buildRoadToUs(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(1013);
  const group = new THREE.Group();
  ctx.scene.add(group);

  const paths = ctx.paths;
  const startT = paths.tNearest(x, z + 8);
  const endT = paths.tNearest(x, z - 8);

  // --- Stream crossing the road, with a plank bridge over it ---
  const streamZ = z - 2;
  const stream = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 7, 40, 2),
    new THREE.MeshStandardMaterial({
      color: 0x3d6f86,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88
    })
  );
  stream.rotation.x = -Math.PI / 2;
  stream.rotation.z = 0.06;
  stream.position.set(0, 0.06, streamZ);
  stream.receiveShadow = true;
  group.add(stream);

  // Damp banks either side of the water
  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(120, 0.16, 1.6), MAT.soil);
    bank.position.set(0, 0.08, streamZ + side * 4.2);
    bank.receiveShadow = true;
    group.add(bank);
  }

  const bridgeT = paths.tNearest(0, streamZ);
  const bridgeCenter = paths.pointAt(bridgeT, new THREE.Vector3());
  const bridgeHeading = paths.headingAt(bridgeT);

  const bridge = new THREE.Group();
  bridge.position.set(bridgeCenter.x, 0, bridgeCenter.z);
  bridge.rotation.y = bridgeHeading;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 9), MAT.plank);
  deck.position.y = 0.34;
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);

  for (let i = 0; i < 11; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.6), MAT.wood);
    plank.position.set(0, 0.46, -4.2 + i * 0.84);
    plank.receiveShadow = true;
    bridge.add(plank);
  }

  const railPostGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
  for (const side of [-1.7, 1.7]) {
    for (const along of [-4, -1.3, 1.3, 4]) {
      const post = new THREE.Mesh(railPostGeo, MAT.darkWood);
      post.position.set(side, 0.85, along);
      post.castShadow = true;
      bridge.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 8.6), MAT.darkWood);
    rail.position.set(side, 1.24, 0);
    rail.castShadow = true;
    bridge.add(rail);
  }
  group.add(bridge);

  // The water drifts very slowly, just enough to catch the light.
  ctx.registerAnimated((time) => {
    stream.material.opacity = 0.84 + Math.sin(time * 0.9) * 0.04;
    stream.position.x = Math.sin(time * 0.25) * 0.4;
  });

  // Stones along the water's edge
  for (let i = 0; i < 26; i++) {
    const sx = -50 + rand() * 100;
    const side = rand() < 0.5 ? -1 : 1;
    if (Math.abs(sx - bridgeCenter.x) < 4) continue;
    ctx.fields.rocks.add(sx, streamZ + side * (3.8 + rand() * 1.4), {
      scale: 0.5 + rand() * 0.8,
      rotY: rand() * Math.PI
    });
  }

  // --- Three signposts along the path before the stream, spaced so they do not crowd the clearing ---
  group.userData.signposts = [];
  const roadWishMessages = [
    {
      title: "One Constant Line 🧿",
      lines: [
        "Just like every year, one line will always be constant:",
        "\"WORLD NEEDS MORE PEOPLE LIKE YOU.\"",
        "Wishing you lots & lots of happiness, love and good health 🧿"
      ],
      signoff: "— Shikhar ❤️"
    },
    {
      title: "To My Safe Place ❤️",
      lines: [
        "Thank you for teaching me the way you wanted to be loved.",
        "This is by far one of the best things happening in my life.",
        "Thank you for being in my life & please be mine only ❤️"
      ],
      signoff: "— Yours only, Shikhar"
    },
    {
      title: "My Birthday Gift & Promise 🌹",
      lines: [
        "It doesn't matter how tough things ever get,",
        "ya hum budhe ho jayein wrinkles aa jayein🌚...",
        "Mai kabhi tumko chhodke kahi aur nahi jane wala. Promise."
      ],
      signoff: "— My forever gift to you ❤️"
    }
  ];

  // Stop signposts well before the stream bridge (0.62) so the bridge and finale view stay open and uncluttered
  const signEndT = startT + (endT - startT) * 0.62;
  const signCount = roadWishMessages.length;
  for (let i = 0; i < signCount; i++) {
    const t = startT + ((signEndT - startT) * (i + 0.4)) / signCount;
    const side = i % 2 === 0 ? -1 : 1;
    const spot = paths.offsetAt(t, side * 3.8, new THREE.Vector3());
    const heading = paths.headingAt(t);

    const msg = roadWishMessages[i];
    const sign = createSignpost({
      boardWidth: 2.8,
      boardHeight: 1.4,
      height: 1.55,
      title: msg.title,
      lines: msg.lines,
      signoff: msg.signoff
    });
    sign.position.set(spot.x, 0, spot.z);
    // Boards angle to face someone walking up the road
    sign.rotation.y = heading + Math.PI + side * 0.35;
    group.add(sign);
    group.userData.signposts.push(sign);
    ctx.addCircle(spot.x, spot.z, 0.5);
  }

  // --- Lanterns closer together than elsewhere: a lit, sheltered corridor ---
  const lanternCount = 8;
  for (let i = 0; i <= lanternCount; i++) {
    const t = startT + ((endT - startT) * i) / lanternCount;
    const side = i % 2 === 0 ? 1 : -1;
    const spot = ctx.paths.offsetAt(t, side * 2.9, new THREE.Vector3());
    if (Math.abs(spot.z - streamZ) < 6) continue;

    const lantern = createLantern({
      height: 2.3,
      glass: tinted(MAT.lampGlow, 0xffc98d)
    });
    lantern.position.set(spot.x, 0, spot.z);
    group.add(lantern);
    ctx.addCircle(spot.x, spot.z, 0.45);
  }

  // --- Pines pressing in on both sides to narrow the view ---
  // They stay at least 9m out so they frame the road rather than block the
  // view down it — the lit finale arch should stay visible from here.
  for (let i = 0; i < 60; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    const lateral = side * (9 + rand() * 18);
    const spot = paths.offsetAt(t, lateral, new THREE.Vector3());
    if (Math.abs(spot.z - streamZ) < 5) continue;

    ctx.fields.pines.add(spot.x, spot.z, {
      scale: 0.9 + rand() * 0.7,
      rotY: rand() * Math.PI * 2
    });
    ctx.addCircle(spot.x, spot.z, 0.8);
  }

  for (let i = 0; i < 30; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    const spot = paths.offsetAt(t, side * (3.4 + rand() * 6), new THREE.Vector3());
    ctx.fields.grass.add(spot.x, spot.z, { scale: 0.7 + rand() * 0.6, rotY: rand() * Math.PI });
  }

  // Register gentle milestone interaction
  ctx.interactions.register({
    id: 'road_to_us',
    x: x,
    z: z,
    radius: 4.8,
    label: 'Reflect along the gentle path',
    onEnter: () => {
      ctx.messagePanel?.show('Step by step, through patience and understanding, learning that home is not a place, but a person where you feel completely safe.');
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  return group;
}
