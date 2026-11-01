import * as THREE from 'three';
import {clamp, ease} from '../lib/motion';
import {disposeGroup, glowMaterial, orb} from './primitives';
import type {SceneRig} from './types';

/** The opening packet grows into a planet of connections; the same planet closes the film. */
export const createWorldScene = (ending: boolean): SceneRig => {
  const group = new THREE.Group();
  const globe = new THREE.Group();
  group.add(globe);
  const color = ending ? '#8051c4' : '#087f86';
  const radius = 3.65;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), new THREE.MeshStandardMaterial({color: '#6cabc6', metalness: 0.15, roughness: 0.48, transparent: true, opacity: 0.94}));
  globe.add(shell);
  const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(radius * 1.005, 24, 12)), new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.22}));
  globe.add(grid);

  const points: THREE.Vector3[] = [];
  const positions = new Float32Array(720 * 3);
  for (let i = 0; i < 720; i++) {
    const y = 1 - 2 * (i + 0.5) / 720;
    const angle = i * 2.399963;
    const r = Math.sqrt(1 - y * y);
    const point = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r).multiplyScalar(radius * 1.025);
    points.push(point);
    point.toArray(positions, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const network = new THREE.Points(geometry, new THREE.PointsMaterial({color, size: 0.045, transparent: true, opacity: 0.8, sizeAttenuation: true}));
  globe.add(network);
  const paths: THREE.CatmullRomCurve3[] = [];
  const arcs: THREE.Line[] = [];
  const packets: THREE.Group[] = [];
  for (let i = 0; i < 36; i++) {
    const a = points[(i * 19 + 87) % points.length];
    const b = points[(i * 83 + 321) % points.length];
    const mid = a.clone().add(b).normalize().multiplyScalar(radius * (1.2 + (i % 3) * 0.12));
    const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.65).normalize().multiplyScalar(radius * 1.22), mid, b.clone().lerp(mid, 0.65).normalize().multiplyScalar(radius * 1.22), b]);
    paths.push(curve);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), new THREE.LineBasicMaterial({color: i % 4 === 0 ? '#b86516' : color, transparent: true, opacity: 0.62}));
    globe.add(line);
    arcs.push(line);
    const packet = orb(i % 4 === 0 ? '#b86516' : color, 0.055);
    globe.add(packet);
    packets.push(packet);
  }
  const orbits: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (1.36 + i * 0.13), 0.014, 6, 160), glowMaterial(color));
    ring.rotation.set(1.2 + i * 0.32, i * 0.4, i * 0.8);
    globe.add(ring);
    orbits.push(ring);
  }
  const seed = new THREE.Group();
  const a = orb(color, 0.2);
  const b = orb(color, 0.2);
  a.position.set(-2.7, 0, 0);
  b.position.set(2.7, 0, 0);
  seed.add(a, b);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 5.4, 8), glowMaterial(color));
  wire.rotation.z = Math.PI / 2;
  seed.add(wire);
  const firstPacket = orb('#ffffff', 0.12);
  seed.add(firstPacket);
  group.add(seed);
  return {
    group,
    update: (time, progress) => {
      const build = ending ? ease(time / 1.5) : ease((time - 1.4) / 2.1, 'power2.inOut');
      globe.visible = build > 0.001;
      globe.scale.setScalar(Math.max(0.001, build));
      globe.rotation.set(0.08, time * 0.17 + (ending ? 1.1 : 0.3), -0.13);
      globe.position.y = ending ? 0.3 : 0.2;
      shell.scale.setScalar(0.97 + build * 0.03);
      geometry.setDrawRange(0, Math.floor(720 * build));
      arcs.forEach((arc, i) => {
        arc.geometry.setDrawRange(0, Math.floor(61 * clamp(build * 2 - i / 36)));
        packets[i].visible = build * 2 > i / 36 + 0.3;
        packets[i].position.copy(paths[i].getPoint((time * (0.13 + (i % 3) * 0.03) + i * 0.17) % 1));
      });
      orbits.forEach((ring, i) => {ring.rotation.z = i * 0.8 + time * (0.08 + i * 0.02);});
      seed.visible = !ending && build < 0.98;
      seed.scale.setScalar(1 - build * 0.9);
      firstPacket.position.x = -2.7 + 5.4 * ease(clamp(time / 1.7), 'power1.inOut');
      group.rotation.y = Math.sin(progress * Math.PI) * 0.12;
    },
    dispose: () => disposeGroup(group),
  };
};
