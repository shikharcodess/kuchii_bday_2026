import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createFenceRun, createBench } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 2 — the Sunflower Garden and "getting ready" corner.
 *
 * A dense sunflower field on both sides of the road (her favourite flower is
 * the centrepiece here), a rose trellis arch over the path, and a small patio
 * off to one side holding a vanity, a jewellery stand and a nail-polish shelf.
 */
export function buildSunflowerGarden(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(2210);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  ctx.scene.add(group);

  // --- Sunflower field either side of the road ---
  // Placement follows the road curve so no flower ends up growing in it, and
  // the patio clearing is kept free too.
  const field = ctx.fields.sunflowers;
  const startT = ctx.paths.tNearest(x, z + 28);
  const endT = ctx.paths.tNearest(x, z - 28);
  const patioCenter = new THREE.Vector2(x - 11, z);
  const spot = new THREE.Vector3();

  for (let i = 0; i < 300; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    const lateral = side * (3.8 + rand() * 15);
    ctx.paths.offsetAt(t, lateral, spot);

    if (Math.hypot(spot.x - patioCenter.x, spot.z - patioCenter.y) < 5.6) continue;

    field.add(spot.x, spot.z, {
      scale: 0.85 + rand() * 0.45,
      rotY: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 0.12
    });
  }

  // A ring of taller sunflowers around the patio so the corner feels enclosed
  for (let i = 0; i < 22; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 5.8 + rand() * 2.6;
    field.add(
      patioCenter.x + Math.sin(angle) * dist,
      patioCenter.y + Math.cos(angle) * dist,
      {
        scale: 1.05 + rand() * 0.4,
        rotY: rand() * Math.PI * 2
      }
    );
  }

  // --- Rose trellis arch spanning the road ---
  const arch = new THREE.Group();
  arch.position.set(0, 0, 14);
  const archPostGeo = new THREE.CylinderGeometry(0.11, 0.13, 3.2, 8);
  for (const side of [-2.9, 2.9]) {
    const post = new THREE.Mesh(archPostGeo, MAT.plank);
    post.position.set(side, 1.6, 0);
    post.castShadow = true;
    arch.add(post);
  }
  const archTop = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.11, 8, 20, Math.PI),
    MAT.plank
  );
  archTop.position.y = 3.2;
  archTop.castShadow = true;
  arch.add(archTop);

  // Climbing roses on the arch
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const angle = Math.PI * t;
    const rose = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16 + rand() * 0.08, 0),
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
  group.add(arch);
  ctx.addCircle(x - 2.9, z + 14, 0.5);
  ctx.addCircle(x + 2.9, z + 14, 0.5);

  // --- "Getting ready" patio, off the west side of the path ---
  const patio = new THREE.Group();
  patio.position.set(-11, 0, 0);
  patio.rotation.y = Math.PI / 2.6;

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.5, 0.22, 24), MAT.sandstone);
  deck.position.y = 0.11;
  deck.receiveShadow = true;
  patio.add(deck);

  // Vanity table with mirror
  const vanity = new THREE.Group();
  vanity.position.set(0, 0.22, -1.9);

  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1), MAT.white);
  tableTop.position.y = 0.9;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  vanity.add(tableTop);

  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.9, 8);
  for (const [lx, lz] of [[-1.15, -0.35], [1.15, -0.35], [-1.15, 0.35], [1.15, 0.35]]) {
    const leg = new THREE.Mesh(legGeo, MAT.gold);
    leg.position.set(lx, 0.45, lz);
    leg.castShadow = true;
    vanity.add(leg);
  }

  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 26), MAT.gold);
  mirrorFrame.position.set(0, 1.85, -0.3);
  mirrorFrame.castShadow = true;
  vanity.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 26),
    new THREE.MeshStandardMaterial({
      color: 0xdfe9ee,
      roughness: 0.08,
      metalness: 0.9
    })
  );
  mirrorGlass.position.set(0, 1.85, -0.27);
  vanity.add(mirrorGlass);

  const mirrorPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), MAT.gold);
  mirrorPost.position.set(0, 1.2, -0.3);
  vanity.add(mirrorPost);

  // Glitter palette + brushes in gold and baby pink
  const palette = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.36), MAT.gold);
  palette.position.set(-0.75, 1.0, 0.1);
  palette.castShadow = true;
  vanity.add(palette);

  for (let i = 0; i < 3; i++) {
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12),
      tinted(MAT.sparkle, [0xf2c9a0, 0xefb0c0, 0xe8c169][i])
    );
    shade.position.set(-0.9 + i * 0.15, 1.04, 0.1);
    vanity.add(shade);
  }

  const brushCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.11, 0.28, 12),
    MAT.fabricPink
  );
  brushCup.position.set(0.85, 1.1, 0);
  brushCup.castShadow = true;
  vanity.add(brushCup);
  for (let i = 0; i < 4; i++) {
    const brush = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.45, 6),
      MAT.darkWood
    );
    brush.position.set(0.85 + (i - 1.5) * 0.045, 1.35, (i % 2) * 0.05);
    brush.rotation.z = (i - 1.5) * 0.08;
    vanity.add(brush);
  }

  // Nail polish bottle: clear glass with a tiny gold star
  const polish = new THREE.Group();
  polish.position.set(0.2, 1.0, 0.28);
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.2, 10),
    new THREE.MeshStandardMaterial({
      color: 0xfdf3e6,
      roughness: 0.06,
      metalness: 0.35,
      transparent: true,
      opacity: 0.55
    })
  );
  bottle.position.y = 0.1;
  polish.add(bottle);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8), MAT.sparkle);
  cap.position.y = 0.27;
  polish.add(cap);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), MAT.gold);
  star.position.y = 0.41;
  polish.add(star);
  vanity.add(polish);
  patio.userData.polish = polish;

  patio.add(vanity);

  // Jewellery stand: tiny earrings and a delicate anklet
  const stand = new THREE.Group();
  stand.position.set(2.4, 0.22, 0.6);

  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.1, 16), MAT.white);
  standBase.position.y = 0.05;
  standBase.receiveShadow = true;
  stand.add(standBase);

  const standPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 8), MAT.gold);
  standPost.position.y = 0.65;
  standPost.castShadow = true;
  stand.add(standPost);

  const standArm = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 20), MAT.gold);
  standArm.position.y = 1.18;
  standArm.rotation.x = Math.PI / 2;
  stand.add(standArm);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 6, 12), MAT.gold);
    earring.position.set(Math.cos(angle) * 0.3, 1.09, Math.sin(angle) * 0.3);
    stand.add(earring);
  }

  const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 22), MAT.gold);
  anklet.position.set(0, 0.72, 0.2);
  anklet.rotation.x = 0.5;
  stand.add(anklet);

  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), MAT.sparkle);
  pendant.position.set(0, 0.55, 0.32);
  stand.add(pendant);

  patio.add(stand);
  patio.userData.jewelleryStand = stand;

  // A soft light so the corner glows a little at dusk
  const patioLight = new THREE.PointLight(0xffd2b0, 8, 12, 2);
  patioLight.position.set(0, 2.6, 0);
  patio.add(patioLight);

  group.add(patio);
  ctx.addCircle(x - 11, z, 4.6);

  // --- Dressing around the garden ---
  const bench = createBench();
  bench.position.set(x + 9, 0, z - 6);
  bench.rotation.y = Math.PI / 1.7;
  ctx.scene.add(bench);
  ctx.addCircle(x + 9, z - 6, 1.2);

  ctx.scene.add(createFenceRun(x + 4.5, z + 20, x + 19, z + 20));
  ctx.scene.add(createFenceRun(x - 19, z - 22, x - 5, z - 22));

  for (let i = 0; i < 18; i++) {
    const t = startT + (endT - startT) * rand();
    const side = rand() < 0.5 ? -1 : 1;
    ctx.paths.offsetAt(t, side * (3.2 + rand() * 12), spot);
    ctx.fields.grass.add(spot.x, spot.z, {
      scale: 0.8 + rand() * 0.7,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x + 21, z + 6, { scale: 1.15, rotY: 1.2 });
  ctx.fields.trees.add(x - 23, z - 12, { scale: 1.05, rotY: 0.2 });
  ctx.addCircle(x + 21, z + 6, 0.9);
  ctx.addCircle(x - 23, z - 12, 0.9);

  return group;
}
