import * as THREE from 'three';
import { MAT, tinted } from '../Materials.js';
import { createStringLights, createLantern, createSignpost } from '../Props.js';
import { seededRandom } from '../../utils/MathUtils.js';

/**
 * Station 4 — Drive & Dream Scenic Overlook.
 *
 * A dedicated station celebrating her dream and goal to learn to drive:
 * - A beautifully detailed vintage convertible sports roadster.
 * - Glowing headlights, chrome grille, windshield, and cream/cherry lacquer body.
 * - Detailed leather interior with steering wheel, dashboard dials, and rearview mirror.
 * - Cute "L" (Learner Driver) plate and personalized "KUCHII" license plate.
 * - Road-trip accessories: picnic basket, thermos, and road map.
 * - Scenic valley lookout with timber post-and-beam guardrail and warm festoon lighting.
 * - Heartfelt wish signboard inspired by wish.txt.
 * - Interactive car horn & roadtrip celebration surprise!
 */
export function buildDrivingOverlook(ctx) {
  const { x, z } = ctx.station.position;
  const rand = seededRandom(4104);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = 0.25;
  ctx.scene.add(group);

  // --- 1. Scenic Viewpoint Paved Terrace ---
  const terraceW = 16;
  const terraceD = 13;
  const terrace = new THREE.Mesh(
    new THREE.BoxGeometry(terraceW, 0.22, terraceD),
    MAT.sandstone
  );
  terrace.position.y = 0.11;
  terrace.receiveShadow = true;
  group.add(terrace);

  // Stone border kerb
  const kerb = new THREE.Mesh(
    new THREE.BoxGeometry(terraceW + 0.4, 0.28, terraceD + 0.4),
    MAT.stone
  );
  kerb.position.y = 0.08;
  kerb.receiveShadow = true;
  group.add(kerb);

  // --- 2. Rustic Timber Valley Guardrail ---
  // Along the rear/scenic edge (local -Z)
  const railZ = -terraceD / 2 + 0.4;
  const postSpacing = 2.4;
  const postCount = Math.floor(terraceW / postSpacing);
  for (let i = 0; i <= postCount; i++) {
    const px = -terraceW / 2 + 0.8 + i * postSpacing;
    if (px > terraceW / 2 - 0.8) continue;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 8), MAT.bark);
    post.position.set(px, 0.65, railZ);
    post.castShadow = true;
    group.add(post);
    ctx.addLocalCircle(group, px, railZ, 0.35);
  }

  // Horizontal top & mid timber rails
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(terraceW - 1.2, 0.08, 0.14), MAT.wood);
  topRail.position.set(0, 1.15, railZ);
  topRail.castShadow = true;
  group.add(topRail);

  const midRail = new THREE.Mesh(new THREE.BoxGeometry(terraceW - 1.2, 0.06, 0.12), MAT.wood);
  midRail.position.set(0, 0.72, railZ);
  group.add(midRail);

  // --- 3. The Vintage Convertible Roadster ---
  const car = buildVintageCar();
  car.position.set(0.5, 0.22, 0.8);
  car.rotation.y = -Math.PI / 14;
  group.add(car);
  ctx.addLocalCircle(group, 0.5, 0.8, 2.2);

  // --- 4. Wish Signboard beside the Scenic Railing ---
  const driveSign = createSignpost({
    boardWidth: 2.15,
    boardHeight: 1.05,
    height: 1.5,
    title: "Conquer The Roads, Kuchii 🚗✨",
    lines: [
      "I pray ki tumhari saari dreams & wishes poori hon...",
      "Car achhe se seekho, independent bano & proud feel karo.",
      "Har road tumhari hai, and I'll always be your co-driver ❤️"
    ],
    signoff: "— Shikhar ❤️"
  });
  driveSign.position.set(-5.2, 0.22, -3.8);
  driveSign.rotation.y = 0.35;
  group.add(driveSign);
  ctx.addLocalCircle(group, -5.2, -3.8, 0.6);

  // --- 5. Roadside Festoon Poles & String Lights ---
  // High corner wooden poles
  const poleHeight = 4.6;
  const poleA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleA.position.set(-6.8, poleHeight / 2 + 0.1, -railZ);
  group.add(poleA);

  const poleB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleB.position.set(6.8, poleHeight / 2 + 0.1, -railZ);
  group.add(poleB);

  const poleC = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleC.position.set(-6.8, poleHeight / 2 + 0.1, railZ);
  group.add(poleC);

  const poleD = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 8), MAT.bark);
  poleD.position.set(6.8, poleHeight / 2 + 0.1, railZ);
  group.add(poleD);

  group.add(createStringLights(-6.8, poleHeight, -railZ, 6.8, poleHeight, -railZ, { sag: 0.8, bulbs: 10 }));
  group.add(createStringLights(-6.8, poleHeight, railZ, 6.8, poleHeight, railZ, { sag: 0.8, bulbs: 10 }));
  group.add(createStringLights(-6.8, poleHeight, -railZ, -6.8, poleHeight, railZ, { sag: 0.8, bulbs: 8 }));
  group.add(createStringLights(6.8, poleHeight, -railZ, 6.8, poleHeight, railZ, { sag: 0.8, bulbs: 8 }));

  // Warm overhead ambiance light over the car
  const carLight = new THREE.PointLight(0xffdfa8, 4, 12, 2);
  carLight.position.set(0.5, 3.2, 0.8);
  group.add(carLight);

  // --- 6. Entrance Lantern (placed safely clear of road and path) ---
  const entranceLantern = createLantern({ height: 3.0 });
  entranceLantern.position.set(-6.5, 0.22, 4.8);
  group.add(entranceLantern);
  ctx.addLocalCircle(group, -6.5, 4.8, 0.5);

  // Decorative flower planters flanking the terrace entrance
  for (const px of [-4.5, 4.5]) {
    const planterBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.6), MAT.wood);
    planterBox.position.set(px, 0.35, 5.2);
    planterBox.castShadow = true;
    group.add(planterBox);

    for (let f = 0; f < 5; f++) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        tinted(MAT.rose, f % 2 === 0 ? 0xffb703 : 0xf72585)
      );
      flower.position.set(px - 0.4 + f * 0.2, 0.65, 5.2);
      group.add(flower);
    }
    ctx.addLocalCircle(group, px, 5.2, 0.5);
  }

  // --- 7. Surroundings & Greenery ---
  for (let i = 0; i < 10; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 11 + rand() * 8;
    ctx.fields.bushes.add(x + Math.sin(angle) * dist, z + Math.cos(angle) * dist, {
      scale: 0.7 + rand() * 0.5,
      rotY: rand() * Math.PI
    });
  }

  ctx.fields.trees.add(x - 12, z - 8, { scale: 1.2, rotY: 0.9 });
  ctx.fields.trees.add(x + 11, z - 7, { scale: 1.1, rotY: 1.8 });
  ctx.addCircle(x - 12, z - 8, 0.9);
  ctx.addCircle(x + 11, z - 7, 0.9);

  // --- 8. Interactive Surprise Trigger ---
  ctx.interactions.register({
    id: 'driving_roadster',
    x: x + 0.5,
    z: z + 0.8,
    radius: 3.8,
    label: "Honk the Roadster & Celebrate Kuchii's Drive! 🚗✨",
    onEnter: () => {
      window.dispatchEvent(new CustomEvent('surprise_found', { detail: { id: 'driving_roadster' } }));
    },
    onExit: () => {
      ctx.messagePanel?.hide();
    }
  });

  return group;
}

/**
 * Builds a charming, high-detail vintage convertible roadster.
 */
function buildVintageCar() {
  const car = new THREE.Group();

  // Premium glossy car body lacquer (warm cream / blush)
  const bodyPaint = new THREE.MeshStandardMaterial({
    color: 0xfdf0d5, // warm creamy vintage enamel
    roughness: 0.2,
    metalness: 0.4
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.1,
    metalness: 0.9
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513, // warm saddle leather
    roughness: 0.65,
    metalness: 0.05
  });

  const tireRubber = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.05
  });

  // --- Main Car Body Chassis ---
  const bodyLength = 3.6;
  const bodyWidth = 1.7;
  const bodyHeight = 0.65;

  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength),
    bodyPaint
  );
  mainBody.position.y = 0.55;
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  car.add(mainBody);

  // Rounded front hood extension
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.85, 1.4, 18, 1, false, 0, Math.PI),
    bodyPaint
  );
  hood.rotation.x = -Math.PI / 2;
  hood.rotation.z = Math.PI / 2;
  hood.position.set(0, 0.58, -1.0);
  hood.castShadow = true;
  car.add(hood);

  // Rounded rear trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.83, 0.84, 1.1, 18, 1, false, 0, Math.PI),
    bodyPaint
  );
  trunk.rotation.x = -Math.PI / 2;
  trunk.rotation.z = Math.PI / 2;
  trunk.position.set(0, 0.58, 1.15);
  trunk.castShadow = true;
  car.add(trunk);

  // Chrome front radiator grille
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.45, 0.1),
    chromeMat
  );
  grille.position.set(0, 0.52, -1.82);
  car.add(grille);

  // Chrome front & rear bumpers
  for (const zOffset of [-1.88, 1.88]) {
    const bumper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, bodyWidth + 0.15, 12),
      chromeMat
    );
    bumper.rotation.z = Math.PI / 2;
    bumper.position.set(0, 0.32, zOffset);
    bumper.castShadow = true;
    car.add(bumper);
  }

  // --- Front Headlights (Pair) ---
  for (const side of [-0.55, 0.55]) {
    const headlightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.14, 16),
      chromeMat
    );
    headlightHousing.rotation.x = Math.PI / 2;
    headlightHousing.position.set(side, 0.62, -1.78);
    car.add(headlightHousing);

    const headlightGlass = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0xfffae0,
        emissive: 0xffd166,
        emissiveIntensity: 0.8,
        roughness: 0.1
      })
    );
    headlightGlass.rotation.x = -Math.PI / 2;
    headlightGlass.position.set(side, 0.62, -1.84);
    car.add(headlightGlass);
  }

  // --- 4 Spoke Vintage Wheels ---
  const wheelPositions = [
    [-bodyWidth / 2 - 0.08, 0.32, -1.1],
    [bodyWidth / 2 + 0.08, 0.32, -1.1],
    [-bodyWidth / 2 - 0.08, 0.32, 1.1],
    [bodyWidth / 2 + 0.08, 0.32, 1.1]
  ];

  for (const [wx, wy, wz] of wheelPositions) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);

    // Black rubber tire
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.18, 20),
      tireRubber
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Chrome hubcap with white sidewall
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.19, 16),
      chromeMat
    );
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    car.add(wheelGroup);
  }

  // --- Open-Top Cabin & Leather Bucket Seats ---
  const cabinRecess = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth - 0.28, 0.35, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x221c18, roughness: 0.85 })
  );
  cabinRecess.position.set(0, 0.74, 0.05);
  car.add(cabinRecess);

  // Driver (Right/Left) & Passenger Leather Bucket Seats
  for (const side of [-0.38, 0.38]) {
    // Seat base
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.58),
      leatherMat
    );
    seatBase.position.set(side, 0.74, 0.1);
    seatBase.castShadow = true;
    car.add(seatBase);

    // Seat backrest
    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.52, 0.16),
      leatherMat
    );
    seatBack.position.set(side, 0.98, 0.4);
    seatBack.rotation.x = -0.15;
    seatBack.castShadow = true;
    car.add(seatBack);
  }

  // Dashboard
  const dash = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth - 0.3, 0.22, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.5 })
  );
  dash.position.set(0, 0.92, -0.45);
  car.add(dash);

  // Steering Wheel (on the right for Indian drive)
  const steerGroup = new THREE.Group();
  steerGroup.position.set(0.38, 1.02, -0.32);
  steerGroup.rotation.x = -0.45;

  const steerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.024, 8, 20),
    chromeMat
  );
  steerGroup.add(steerRing);

  const steerCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8),
    chromeMat
  );
  steerCol.rotation.x = Math.PI / 2;
  steerCol.position.z = -0.12;
  steerGroup.add(steerCol);
  car.add(steerGroup);

  // Windshield Frame & Glass
  const windshieldFrame = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth - 0.18, 0.04, 0.04),
    chromeMat
  );
  windshieldFrame.position.set(0, 1.34, -0.48);
  car.add(windshieldFrame);

  const windshieldGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(bodyWidth - 0.22, 0.44),
    new THREE.MeshStandardMaterial({
      color: 0xd8f3dc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    })
  );
  windshieldGlass.position.set(0, 1.15, -0.5);
  windshieldGlass.rotation.x = 0.32;
  car.add(windshieldGlass);

  // Rearview Mirror
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.07, 0.03),
    chromeMat
  );
  mirror.position.set(0, 1.32, -0.46);
  car.add(mirror);

  // --- License Plates & Learner "L" Badge ---
  // Front license plate: "KUCHII 🧿"
  const frontPlate = createLicensePlateMesh("KUCHII 🧿");
  frontPlate.position.set(0, 0.36, -1.89);
  car.add(frontPlate);

  // Rear license plate: "KUCHII 🧿"
  const rearPlate = createLicensePlateMesh("KUCHII 🧿");
  rearPlate.position.set(0, 0.36, 1.89);
  rearPlate.rotation.y = Math.PI;
  car.add(rearPlate);

  // Learner "L" plate badge on the rear left bumper
  const learnerBadge = createLearnerBadgeMesh();
  learnerBadge.position.set(-0.52, 0.58, 1.82);
  learnerBadge.rotation.y = Math.PI;
  car.add(learnerBadge);

  // --- Trunk Road-Trip Props ---
  // Wicker Picnic Basket
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.32, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xbc6c25, roughness: 0.9 })
  );
  basket.position.set(-0.25, 0.98, 0.95);
  basket.castShadow = true;
  car.add(basket);

  // Thermos flask
  const thermos = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.32, 12),
    new THREE.MeshStandardMaterial({ color: 0xd90429, metalness: 0.5, roughness: 0.3 })
  );
  thermos.position.set(0.28, 0.98, 0.95);
  thermos.castShadow = true;
  car.add(thermos);

  return car;
}

/**
 * Creates a canvas-textured license plate.
 */
function createLicensePlateMesh(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 256, 80);

  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 72);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Cinzel", "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.16),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 })
  );
  return mesh;
}

/**
 * Creates the classic red-and-white Learner Driver "L" badge.
 */
function createLearnerBadgeMesh() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#d90429';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);

  // Bold Red "L"
  ctx.fillStyle = '#d90429';
  ctx.font = '900 96px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', 64, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.24),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 })
  );
  return mesh;
}
