import * as THREE from 'three';
import { CONTENT } from '../config/content.js';
import { MAT } from './Materials.js';

/**
 * The road that ties the whole world together.
 *
 * A Catmull-Rom curve runs from the front porch to the finale, passing through
 * every station in the order set out in the brief. The curve is also the
 * placement backbone for lanterns, trees and edge stones, so the walk between
 * stations never feels empty.
 */
export class Paths {
  constructor(scene) {
    this.scene = scene;

    // Waypoints: station centres plus gentle meander points so the route
    // curves comfortably through the scenic ~120m cozy world.
    this.waypoints = [
      [0, 8],
      [0, 0], // House Porch
      [-2, -12],
      [-4, -24], // Sunflower Garden & Koi Pond
      [4, -36],
      [12, -46], // Dream Travel Pavilion
      [2, -58],
      [-12, -68], // Nostalgia Corner
      [-2, -78],
      [9, -88], // Food Street
      [4, -98],
      [0, -106], // The Road That Led To Us
      [0, -116],
      [0, -126] // Finale Dance Gazebo
    ];

    this.curve = new THREE.CatmullRomCurve3(
      this.waypoints.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      false,
      'catmullrom',
      0.5
    );

    this.length = this.curve.getLength();
    this.build();
  }

  /** Path narrows over the final emotional stretch for a quieter feel. */
  widthAt(t) {
    const base = CONTENT.world.pathWidth;
    if (t < 0.72) return base;
    const narrow = Math.min(1, (t - 0.72) / 0.2);
    return base * (1 - narrow * 0.38);
  }

  build() {
    const segments = 180;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const point = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      this.curve.getPointAt(t, point);
      this.curve.getTangentAt(t, tangent);
      side.crossVectors(tangent, up).normalize().multiplyScalar(this.widthAt(t) / 2);

      positions.push(
        point.x - side.x, 0.03, point.z - side.z,
        point.x + side.x, 0.03, point.z + side.z
      );
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t * 40, 1, t * 40);

      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    const material = MAT.gravel.clone();
    material.polygonOffset = true;
    material.polygonOffsetFactor = -2;
    material.polygonOffsetUnits = -2;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'path';
    this.scene.add(this.mesh);
  }

  /** World-space point on the path at normalised distance `t` (0..1). */
  pointAt(t, target = new THREE.Vector3()) {
    return this.curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1), target);
  }

  /** Point offset sideways from the path — positive is to the right of travel. */
  offsetAt(t, lateral, target = new THREE.Vector3()) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    const point = this.curve.getPointAt(clamped, target);
    const tangent = this.curve.getTangentAt(clamped, _tangent);
    _side.crossVectors(tangent, _up).normalize().multiplyScalar(lateral);
    point.add(_side);
    return point;
  }

  /** Coarse search for the `t` whose path point is nearest a world position. */
  tNearest(x, z, samples = 400) {
    let bestT = 0;
    let bestDist = Infinity;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const point = this.curve.getPointAt(t, _probe);
      const dist = (point.x - x) ** 2 + (point.z - z) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestT = t;
      }
    }
    return bestT;
  }

  /** Heading (radians) along the path at `t`, for orienting props. */
  headingAt(t) {
    const tangent = this.curve.getTangentAt(THREE.MathUtils.clamp(t, 0, 1), _tangent);
    return Math.atan2(tangent.x, tangent.z);
  }
}

const _tangent = new THREE.Vector3();
const _probe = new THREE.Vector3();
const _side = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
