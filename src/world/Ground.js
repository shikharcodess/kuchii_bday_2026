import * as THREE from 'three';

export class Ground {
  constructor(scene) {
    this.scene = scene;
    this.initGround();
    this.initTestProps();
  }

  initGround() {
    // Large ground plane for the walking world
    const groundGeometry = new THREE.PlaneGeometry(300, 400, 64, 64);
    
    // Warm, realistic-leaning meadow/earth PBR material
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d4a36, // deep lush warm green
      roughness: 0.88,
      metalness: 0.05,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, 0, -100);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // Add a circular stone courtyard / porch paving for the starting area
    const porchGeo = new THREE.CylinderGeometry(5.5, 5.8, 0.2, 32);
    const porchMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb8, // warm sandstone
      roughness: 0.75,
      metalness: 0.08
    });
    this.porch = new THREE.Mesh(porchGeo, porchMat);
    this.porch.position.set(0, 0.1, 0);
    this.porch.receiveShadow = true;
    this.porch.castShadow = true;
    this.scene.add(this.porch);
  }

  initTestProps() {
    // Stylized starting milestone / garden planter to demonstrate soft shadow casting
    const pedestalGroup = new THREE.Group();

    // Base pillar
    const baseGeo = new THREE.BoxGeometry(1.2, 1.4, 1.2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xeeddc5,
      roughness: 0.6,
      metalness: 0.1
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.7;
    base.castShadow = true;
    base.receiveShadow = true;
    pedestalGroup.add(base);

    // Warm glowing crystal / orb on top (preview of golden tones for Kuchii)
    const orbGeo = new THREE.SphereGeometry(0.45, 32, 32);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xf6c878,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x7c4e10,
      emissiveIntensity: 0.4
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.7;
    orb.castShadow = true;
    pedestalGroup.add(orb);

    pedestalGroup.position.set(2.5, 0.2, -1.5);
    this.scene.add(pedestalGroup);
    this.pedestalOrb = orb;

    // Small stone garden bench
    const benchGroup = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(2.4, 0.18, 0.8);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0xc4b9a8,
      roughness: 0.7,
      metalness: 0.05
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.6;
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    const legGeo = new THREE.BoxGeometry(0.3, 0.6, 0.6);
    const legLeft = new THREE.Mesh(legGeo, seatMat);
    legLeft.position.set(-0.8, 0.3, 0);
    legLeft.castShadow = true;
    legLeft.receiveShadow = true;
    benchGroup.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, seatMat);
    legRight.position.set(0.8, 0.3, 0);
    legRight.castShadow = true;
    legRight.receiveShadow = true;
    benchGroup.add(legRight);

    benchGroup.position.set(-2.8, 0.2, 0.5);
    benchGroup.rotation.y = 0.3;
    this.scene.add(benchGroup);
  }

  update(time) {
    if (this.pedestalOrb) {
      // Gentle floating bob for the golden orb
      this.pedestalOrb.position.y = 1.7 + Math.sin(time * 2) * 0.05;
    }
  }
}
