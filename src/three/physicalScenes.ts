import * as THREE from 'three';
import {disposeGroup, glowMaterial, link, orb, terminal} from './primitives';
import type {SceneRig} from './types';

type PhysicalKind = 'terminals' | 'bus' | 'wifi' | 'mobile' | 'cell5g';
type Tick = (time: number, progress: number) => void;
type Reveal = {node: THREE.Object3D; position: THREE.Vector3; scale: THREE.Vector3; delay: number};

const clamp = (n: number): number => Math.max(0, Math.min(1, n));
const smooth = (n: number): number => { const p = clamp(n); return p * p * (3 - 2 * p); };
const v = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
const metal = (color = '#182735', roughness = 0.32): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({color, roughness, metalness: 0.72});

const box = (w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const roundedPanel = (w: number, h: number, d: number, radius: number, material: THREE.Material): THREE.Mesh => {
  const shape = new THREE.Shape();
  const left = -w / 2; const right = w / 2; const bottom = -h / 2; const top = h / 2;
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: d, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: Math.min(0.035, radius / 3), bevelThickness: Math.min(0.025, d / 3), curveSegments: 8});
  geometry.translate(0, 0, -d / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const cylinder = (radius: number, height: number, material: THREE.Material, x = 0, y = 0, z = 0, sides = 24): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const cable = (points: THREE.Vector3[], color: string, radius = 0.035, glowing = false): {mesh: THREE.Mesh; path: THREE.CatmullRomCurve3} => {
  const path = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 64, radius, 8, false), glowing ? glowMaterial(color) : metal(color, 0.43));
  return {mesh, path};
};

const pedestal = (color: string, width = 2, depth = 1.9): THREE.Group => {
  const group = new THREE.Group();
  group.add(box(width, 0.18, depth, metal('#122633'), 0, 0, 0));
  group.add(box(width * 0.97, 0.025, depth * 0.97, glowMaterial(color, 0.8), 0, -0.075, 0));
  group.add(box(width * 0.72, 0.66, depth * 0.67, metal('#10222e'), 0, -0.42, 0));
  return group;
};

const laptop = (color: string): THREE.Group => {
  const group = new THREE.Group();
  const casing = metal('#8095a8', 0.26);
  const dark = metal('#0a1522');
  group.add(box(1.6, 0.09, 1.05, casing, 0, 0.05, 0));
  group.add(box(1.42, 0.025, 0.59, dark, 0, 0.11, -0.1));
  for (let row = 0; row < 4; row++) {
    group.add(box(1.28, 0.018, 0.012, metal('#5f7284'), 0, 0.127, -0.32 + row * 0.14));
  }
  group.add(box(0.43, 0.009, 0.18, metal('#495966'), 0, 0.109, 0.32));
  const lid = new THREE.Group();
  lid.position.set(0, 0.1, -0.47);
  lid.rotation.x = -0.16;
  lid.add(box(1.63, 1.1, 0.08, casing, 0, 0.55, 0));
  lid.add(box(1.45, 0.9, 0.018, dark, 0, 0.56, 0.05));
  lid.add(box(1.35, 0.8, 0.01, new THREE.MeshStandardMaterial({color: '#102d43', emissive: color, emissiveIntensity: 0.2, roughness: 0.2}), 0, 0.56, 0.065));
  for (let i = 0; i < 4; i++) {
    lid.add(box(0.7 - (i % 2) * 0.22, 0.022, 0.013, glowMaterial(color, 0.9), -0.18, 0.78 - i * 0.12, 0.075));
  }
  group.add(lid);
  return group;
};

const radioTower = (color: string, height = 3): THREE.Group => {
  const group = new THREE.Group();
  const steel = metal('#71899b', 0.3);
  const radius = 0.27;
  const legs = [v(-radius, 0, -radius), v(radius, 0, -radius), v(0, 0, radius)];
  legs.forEach((p) => {
    group.add(link(p, v(p.x * 0.22, height, p.z * 0.22), '#617a8d', 0.036));
  });
  for (let i = 1; i < 5; i++) {
    const y = height * i / 5;
    const r = radius * (1 - i / 6);
    group.add(link(v(-r, y - height / 5, -r), v(r, y, -r), '#4a6373', 0.022));
    group.add(link(v(r, y - height / 5, -r), v(0, y, r), '#4a6373', 0.022));
  }
  for (let i = 0; i < 3; i++) {
    const antenna = new THREE.Group();
    antenna.rotation.y = i * Math.PI * 2 / 3;
    antenna.add(box(0.19, 0.75, 0.12, steel, 0, height - 0.12, 0.2));
    antenna.add(box(0.065, 0.5, 0.018, glowMaterial(color), 0, height - 0.12, 0.27));
    group.add(antenna);
  }
  group.add(cylinder(0.05, 0.35, glowMaterial(color), 0, height + 0.28, 0));
  group.add(cylinder(0.5, 0.1, metal('#132935'), 0, 0, 0));
  group.add(cylinder(0.42, 0.45, metal('#172b3a'), 0, -0.225, 0));
  return group;
};

const cityBuilding = (width: number, height: number, depth: number, color: string, seed: number): THREE.Group => {
  const group = new THREE.Group();
  group.add(box(width, height, depth, metal(seed % 2 ? '#273d51' : '#1a3041', 0.24), 0, height / 2, 0));
  group.add(box(width + 0.06, 0.06, depth + 0.06, metal('#5a7182'), 0, height + 0.025, 0));
  const rows = Math.max(2, Math.floor(height / 0.23));
  const cols = Math.max(2, Math.floor(width / 0.22));
  const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, 0.08, 0.012), glowMaterial(color, 0.8), rows * cols);
  const transform = new THREE.Object3D();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      transform.position.set((col - (cols - 1) / 2) * (width / (cols + 1)), 0.15 + row * ((height - 0.23) / rows), depth / 2 + 0.009);
      transform.scale.setScalar((row * 3 + col + seed) % 5 === 0 ? 0.1 : 1);
      transform.updateMatrix();
      windows.setMatrixAt(index, transform.matrix);
    }
  }
  group.add(windows);
  return group;
};

export const createPhysicalScene = (kind: PhysicalKind, color: string): SceneRig => {
  const group = new THREE.Group();
  const labels: NonNullable<SceneRig['labels']> = [];
  const ticks: Tick[] = [];
  const reveals: Reveal[] = [];
  const add = (object: THREE.Object3D, delay = 0): void => {
    group.add(object);
    reveals.push({node: object, position: object.position.clone(), scale: object.scale.clone(), delay});
  };
  const packetOn = (path: THREE.Curve<THREE.Vector3>, delay: number, speed = 0.33, packetColor = color, size = 0.085): void => {
    const packet = orb(packetColor, size);
    group.add(packet);
    ticks.push((time) => {
      const t = ((time - delay) * speed % 1 + 1) % 1;
      packet.position.copy(path.getPoint(t));
      packet.visible = time > delay;
      packet.scale.setScalar(0.7 + Math.sin(t * Math.PI) * 0.5);
    });
  };

  if (kind === 'terminals') {
    const locations = [v(-3.2, -1.55, 1.5), v(2.8, -1.55, 1.5), v(-2.8, -1.55, -2.0), v(3, -1.55, -2.0)];
    const names = ['UCLA', 'SRI', 'UCSB', 'UTAH'];
    locations.forEach((position, i) => {
      const station = new THREE.Group();
      station.position.copy(position);
      const base = pedestal(color, 2.25, 1.9);
      base.position.y = -0.3;
      station.add(base);
      const machine = terminal(color);
      machine.rotation.y = i % 2 === 0 ? 0.18 : -0.18;
      station.add(machine);
      // A separate IMP cabinet makes the early network physically legible.
      const imp = new THREE.Group();
      imp.position.set(i % 2 === 0 ? -1.13 : 1.13, 0.21, -0.13);
      const shell = metal('#617171', 0.5);
      imp.add(box(0.5, 1.18, 0.7, shell));
      for (let shelf = 0; shelf < 4; shelf++) {
        imp.add(box(0.43, 0.025, 0.017, metal('#1c2d2d'), 0, -0.35 + shelf * 0.22, 0.36));
        imp.add(box(0.045, 0.035, 0.02, glowMaterial(shelf % 2 ? '#ffba6a' : color), -0.15, -0.29 + shelf * 0.22, 0.373));
      }
      station.add(imp);
      add(station, i * 0.14);
      labels.push({text: names[i], position: position.clone().add(v(0, 1.5, 0)), color});
    });
    const pairs = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2]];
    pairs.forEach(([from, to], i) => {
      const a = locations[from].clone().add(v(0, -0.25, -0.2));
      const b = locations[to].clone().add(v(0, -0.25, -0.2));
      const middle = a.clone().lerp(b, 0.5);
      middle.y = -2.02;
      middle.z += i % 2 ? -0.45 : 0.45;
      const route = cable([a, a.clone().lerp(middle, 0.6), middle, b.clone().lerp(middle, 0.6), b], '#2b6574', 0.045);
      add(route.mesh, 0.5 + i * 0.08);
      packetOn(route.path, 0.8 + i * 0.16, 0.37, i === 4 ? '#ffd08a' : color);
      packetOn(route.path, 2 + i * 0.16, 0.37, color, 0.06);
    });
    const firstMessage = new THREE.Group();
    firstMessage.position.set(-0.2, -0.4, 0.9);
    firstMessage.add(box(0.92, 0.52, 0.18, metal('#153d4a')));
    firstMessage.add(box(0.48, 0.035, 0.03, glowMaterial('#c6fbff'), 0, 0.07, 0.11));
    firstMessage.add(box(0.3, 0.035, 0.03, glowMaterial(color), -0.09, -0.08, 0.11));
    add(firstMessage, 1.1);
    ticks.push((time) => {firstMessage.rotation.y = Math.sin(time * 0.7) * 0.2;});
    labels.push({text: 'LO →', position: v(-0.2, 0.2, 0.9), color: '#d9ffff'});
  }

  if (kind === 'bus') {
    const amber = '#ffcb70';
    const trunk = new THREE.Group();
    const trunkStart = v(-5.25, -0.85, 1.35);
    const trunkEnd = v(5.25, -0.85, 1.35);
    trunk.add(link(trunkStart, trunkEnd, '#7b6746', 0.115));
    trunk.add(link(trunkStart.clone().add(v(0, 0.075, 0.065)), trunkEnd.clone().add(v(0, 0.075, 0.065)), amber, 0.025));
    for (const x of [-5.25, 5.25]) {
      const cap = cylinder(0.23, 0.34, metal('#c6a268'), x, -0.85, 1.35);
      cap.rotation.z = Math.PI / 2;
      trunk.add(cap);
      trunk.add(link(v(x, -1.99, 1.35), v(x, -0.85, 1.35), '#405867', 0.045));
    }
    add(trunk, 0.12);
    const xs = [-3.8, -1.27, 1.27, 3.8];
    xs.forEach((x, i) => {
      const station = new THREE.Group();
      station.position.set(x, -1.58, -1.1 + (i % 2) * 0.3);
      station.scale.setScalar(0.9);
      station.add(terminal(i === 0 ? amber : color));
      const plinth = pedestal(color, 2.1, 1.95);
      plinth.position.y = -0.27;
      station.add(plinth);
      add(station, i * 0.1);
      const start = v(x, -1.2, station.position.z + 0.1);
      const tap = v(x, -0.85, 1.35);
      const drop = cable([start, v(x, -1.65, 0), v(x, -1.25, 0.95), tap], '#477386', 0.046);
      add(drop.mesh, 0.5 + i * 0.08);
      const connector = cylinder(0.18, 0.38, metal('#c8b58b'), x, -0.85, 1.35);
      connector.rotation.z = Math.PI / 2;
      add(connector, 0.6 + i * 0.08);
      packetOn(drop.path, 1.3 + i * 0.25, i === 0 ? 0.65 : -0.65, i === 0 ? amber : color, 0.08);
      labels.push({text: `NODE 0${i + 1}`, position: v(x, 0.12, station.position.z), color});
    });
    const busPath = new THREE.LineCurve3(trunkStart, trunkEnd);
    for (let p = 0; p < 7; p++) packetOn(busPath, 0.9 + p * 0.28, 0.36, amber, 0.085);
    const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 40), glowMaterial(amber));
    pulse.rotation.y = Math.PI / 2;
    group.add(pulse);
    ticks.push((time) => {
      pulse.position.copy(busPath.getPoint(((time * 0.36) % 1)));
      pulse.scale.setScalar(1 + Math.sin(time * 8) * 0.15);
      pulse.visible = time > 0.8;
    });
    labels.push({text: 'SHARED COAXIAL BUS', position: v(0, -0.05, 1.5), color: amber});
    labels.push({text: '50 Ω', position: v(5.2, -0.25, 1.35), color: amber});
  }

  if (kind === 'wifi') {
    const router = new THREE.Group();
    router.position.set(0, -0.9, 0);
    router.add(box(2.3, 0.39, 1.4, metal('#c0cbd1', 0.22)));
    router.add(box(2.38, 0.08, 1.46, metal('#24394c'), 0, -0.18, 0));
    router.add(box(1.9, 0.035, 0.025, glowMaterial(color), 0, 0.04, 0.72));
    for (let i = 0; i < 7; i++) router.add(box(0.06, 0.035, 0.022, glowMaterial(i < 4 ? color : '#293f4b'), -0.7 + i * 0.23, -0.08, 0.72));
    for (let i = 0; i < 4; i++) {
      const antenna = new THREE.Group();
      antenna.position.set((i % 2 ? 1 : -1) * 0.94, 0.21, i < 2 ? -0.44 : 0.35);
      antenna.rotation.z = (i % 2 ? -1 : 1) * 0.18;
      antenna.rotation.x = i < 2 ? -0.18 : 0.1;
      antenna.add(cylinder(0.06, 1.33, metal('#273e53'), 0, 0.62, 0, 12));
      antenna.add(cylinder(0.065, 0.13, glowMaterial(color), 0, 1.27, 0, 12));
      router.add(antenna);
    }
    const base = pedestal(color, 2.8, 1.95);
    base.position.y = -0.95;
    router.add(base);
    router.add(box(1.8, 0.68, 1.12, metal('#172d3d'), 0, -0.55, 0));
    add(router, 0);
    const clients = [v(-3.7, -1.7, 1.8), v(3.5, -1.65, 1.45), v(2.9, -1.7, -2.25)];
    clients.forEach((position, i) => {
      const device = laptop(color);
      device.position.copy(position);
      device.rotation.y = i === 0 ? 0.32 : -0.27;
      device.add(box(1.46, 0.76, 0.89, metal('#122938'), 0, -0.39, 0));
      add(device, 0.4 + i * 0.14);
      const path = new THREE.CatmullRomCurve3([v(0, 0.15, 0), position.clone().add(v(-0.25, 1.8, 0)), position.clone().add(v(0, 0.7, -0.4))]);
      packetOn(path, 1 + i * 0.17, 0.56, color, 0.075);
      packetOn(path, 1.85 + i * 0.17, -0.56, '#ddedff', 0.055);
    });
    for (let i = 0; i < 4; i++) {
      // The hoops carry the signal; the hemisphere is only an atmospheric hint.
      // Draw one surface so overlapping wavefronts never mask the physical devices.
      const waveMaterial = new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.008, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide});
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), waveMaterial);
      shell.position.set(0, -0.6, 0);
      group.add(shell);
      const hoopMaterial = new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending});
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(1, 0.013, 6, 80), hoopMaterial);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(0, -0.7, 0);
      group.add(hoop);
      ticks.push((time) => {
        const p = ((time * 0.3 + i / 4) % 1 + 1) % 1;
        const radius = 0.6 + p * 4.2;
        shell.scale.setScalar(radius);
        hoop.scale.setScalar(radius);
        shell.visible = hoop.visible = time > 0.6;
        waveMaterial.opacity = Math.sin(p * Math.PI) * 0.008;
        hoopMaterial.opacity = Math.sin(p * Math.PI) * 0.38;
      });
    }
    labels.push({text: 'IEEE 802.11', position: v(0, 1.15, 0), color});
    labels.push({text: 'OVER THE AIR', position: v(-3.6, -0.15, 1.8), color: '#d8ecff'});
  }

  if (kind === 'mobile') {
    const phone = new THREE.Group();
    phone.position.set(0, 0.1, 0.8);
    const frame = metal('#7186a0', 0.18);
    phone.add(roundedPanel(2.15, 4.05, 0.29, 0.22, frame));
    const bezel = roundedPanel(2.03, 3.93, 0.04, 0.18, metal('#070f20'));
    bezel.position.z = 0.165;
    phone.add(bezel);
    const glass = roundedPanel(1.85, 3.52, 0.018, 0.12, new THREE.MeshStandardMaterial({color: '#142445', emissive: color, emissiveIntensity: 0.25, metalness: 0.15, roughness: 0.18}));
    glass.position.set(0, -0.02, 0.193);
    phone.add(glass);
    phone.add(box(0.56, 0.045, 0.025, metal('#1a2b40'), 0, 1.88, 0.2));
    phone.add(box(0.59, 0.045, 0.027, glowMaterial('#dae9ff', 0.7), 0, -1.63, 0.21));
    phone.add(box(0.04, 0.5, 0.11, frame, 1.09, 0.71, 0));
    phone.add(box(0.04, 0.36, 0.11, frame, -1.09, 0.8, 0));
    // The screen is modeled as layered UI glass, with physically raised app tiles.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const tileColor = [color, '#79d5ff', '#8b8eff', '#f2b96e', '#82e6cb', '#d78eff'][(row * 3 + col) % 6];
        const app = roundedPanel(0.43, 0.43, 0.065, 0.08, new THREE.MeshStandardMaterial({color: tileColor, emissive: tileColor, emissiveIntensity: 0.28, metalness: 0.22, roughness: 0.22}));
        app.position.set(-0.59 + col * 0.59, 0.86 - row * 0.64, 0.225);
        phone.add(app);
        phone.add(box(0.21, 0.033, 0.02, glowMaterial('#f3faff'), app.position.x, app.position.y, 0.269));
        if ((row + col) % 2) phone.add(box(0.033, 0.2, 0.02, glowMaterial('#f3faff'), app.position.x, app.position.y, 0.269));
      }
    }
    phone.add(box(1.5, 0.25, 0.025, metal('#42557b'), 0, 1.4, 0.22));
    phone.add(box(1.25, 0.04, 0.022, glowMaterial('#c9d9ff'), 0, 1.4, 0.24));
    add(phone, 0.08);
    ticks.push((time) => {phone.rotation.y = -0.15 + Math.sin(time * 0.55) * 0.18; phone.rotation.z = Math.sin(time * 0.4) * 0.035;});
    const cities = [-1, 1];
    cities.forEach((side) => {
      const tower = radioTower(color, 2.9);
      tower.position.set(side * 4.15, -2.05, -1.0);
      add(tower, 0.35);
      for (let i = 0; i < 3; i++) {
        const building = cityBuilding(0.5 + i * 0.1, 1.09 + (i % 2) * 0.5, 0.7, color, i + 5);
        building.position.set(side * (2.9 + i * 0.8), -2.52, -2.15 - (i % 2) * 0.5);
        add(building, 0.45 + i * 0.08);
      }
      const signal = cable([v(side * 4.15, 0.95, -1), v(side * 2.2, 2.1, -0.4), v(side * 0.5, 1.3, 0.8)], color, 0.012, true);
      add(signal.mesh, 0.8);
      for (let i = 0; i < 3; i++) packetOn(signal.path, 0.95 + i * 0.4, 0.4, color, 0.075);
    });
    for (let i = 0; i < 5; i++) {
      const app = new THREE.Group();
      const tileColor = [color, '#80d5ff', '#93e6c3', '#ffd18c', '#a9a1ff'][i];
      app.add(roundedPanel(0.56, 0.56, 0.15, 0.1, new THREE.MeshStandardMaterial({color: '#233b5a', emissive: tileColor, emissiveIntensity: 0.17, metalness: 0.65, roughness: 0.2})));
      const icon = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 24), glowMaterial(tileColor));
      icon.position.z = 0.09;
      app.add(icon);
      group.add(app);
      ticks.push((time) => {
        const angle = i * Math.PI * 2 / 5 + time * 0.25;
        app.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 1.5 + 0.25, Math.sin(angle) * 0.7 + 1.3);
        app.rotation.set(Math.sin(time + i) * 0.13, Math.sin(angle) * 0.3, Math.sin(angle) * 0.1);
        app.scale.setScalar(smooth((time - 0.6 - i * 0.08) / 0.55));
      });
    }
    labels.push({text: 'ALWAYS CONNECTED', position: v(0, 2.6, 0.8), color});
    labels.push({text: 'THE INTERNET IN YOUR POCKET', position: v(0, -2.25, 1.6), color: '#dce9ff'});
  }

  if (kind === 'cell5g') {
    const cellCenters = [v(0, -2.15, 0), v(-2.5, -2.15, 0), v(2.5, -2.15, 0), v(-1.25, -2.15, -2.16), v(1.25, -2.15, -2.16), v(-1.25, -2.15, 2.16), v(1.25, -2.15, 2.16)];
    const cells: THREE.Mesh[] = [];
    cellCenters.forEach((position, i) => {
      const cell = new THREE.Group();
      cell.position.copy(position);
      const platform = cylinder(1.43, 0.19, metal('#183144'), 0, 0, 0, 6);
      platform.rotation.y = Math.PI / 6;
      cell.add(platform);
      const foundation = cylinder(1.32, 0.3, metal('#122633'), 0, -0.25, 0, 6);
      foundation.rotation.y = Math.PI / 6;
      cell.add(foundation);
      const rim = cylinder(1.45, 0.035, new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: 0.8, roughness: 0.4, metalness: 0.6}), 0, -0.05, 0, 6);
      rim.rotation.y = Math.PI / 6;
      cell.add(rim);
      cells.push(rim);
      for (let road = 0; road < 2; road++) {
        const lane = box(1.97, 0.015, 0.02, glowMaterial('#7394b3', 0.65), 0, 0.11, road ? 0.33 : -0.33);
        cell.add(lane);
      }
      if (i !== 0) {
        for (let b = 0; b < 2; b++) {
          const building = cityBuilding(0.43 + (i % 2) * 0.1, 0.5 + ((i * 3 + b) % 5) * 0.25, 0.49, color, i + b);
          building.position.set(b ? 0.36 : -0.36, 0.11, b ? -0.5 : 0.54);
          cell.add(building);
        }
      }
      add(cell, 0.08 + i * 0.08);
    });
    const tower = radioTower(color, 3.65);
    tower.position.set(0, -2.03, 0);
    add(tower, 0.3);
    const head = orb(color, 0.17);
    head.position.set(0, 1.98, 0);
    add(head, 0.6);
    for (let i = 1; i < cellCenters.length; i++) {
      const target = cellCenters[i].clone().add(v(0, 1.3, 0));
      const start = v(0, 1.72, 0);
      const directed = link(start, target, color, 0.011);
      add(directed, 0.65 + i * 0.06);
      const path = new THREE.LineCurve3(start, target);
      packetOn(path, 0.8 + i * 0.08, 0.9, color, 0.065);
      packetOn(path, 1.3 + i * 0.08, -0.9, '#edf7ff', 0.04);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.3, start.distanceTo(target), 16, 1, true), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.042, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
      beam.position.copy(start).lerp(target, 0.5);
      beam.quaternion.setFromUnitVectors(v(0, 1, 0), start.clone().sub(target).normalize());
      add(beam, 0.85 + i * 0.06);
    }
    for (let i = 0; i < 3; i++) {
      const car = new THREE.Group();
      car.add(box(0.48, 0.14, 0.23, metal(i === 1 ? '#e6d2b8' : '#93a9bc'), 0, 0.11, 0));
      car.add(box(0.25, 0.12, 0.21, metal('#142b43'), -0.02, 0.23, 0));
      car.add(box(0.025, 0.035, 0.17, glowMaterial('#e8f4ff'), 0.25, 0.12, 0));
      for (const x of [-0.15, 0.15]) for (const z of [-0.12, 0.12]) {
        const wheel = cylinder(0.063, 0.035, metal('#070f19'), x, 0.07, z, 10);
        wheel.rotation.x = Math.PI / 2;
        car.add(wheel);
      }
      group.add(car);
      ticks.push((time) => {
        const angle = i * Math.PI * 2 / 3 + time * 0.4;
        car.position.set(Math.cos(angle) * 2.65, -2.0, Math.sin(angle) * 2.4);
        car.rotation.y = -angle - Math.PI / 2;
        car.scale.setScalar(smooth((time - 0.8) / 0.5));
      });
    }
    // A compact drone makes the low-latency links tangible above the city.
    const drone = new THREE.Group();
    drone.add(box(0.38, 0.12, 0.25, metal('#b4c6d6')));
    const rotors: THREE.Mesh[] = [];
    for (const x of [-0.35, 0.35]) for (const z of [-0.3, 0.3]) {
      drone.add(link(v(0, 0, 0), v(x, 0, z), '#8099aa', 0.025));
      const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 6, 24), glowMaterial(color));
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(x, 0.04, z);
      drone.add(rotor);
      rotors.push(rotor);
    }
    group.add(drone);
    ticks.push((time) => {
      drone.position.set(-2.65 + Math.sin(time * 0.5) * 0.5, 1.5 + Math.sin(time * 1.5) * 0.13, 0.6);
      drone.rotation.z = Math.sin(time * 1.4) * 0.08;
      drone.scale.setScalar(smooth((time - 0.65) / 0.6));
      rotors.forEach((rotor) => {rotor.rotation.z = time * 20;});
      cells.forEach((cell, i) => {(cell.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45 + (Math.sin(time * 2.5 - i * 0.7) + 1) * 0.32;});
    });
    labels.push({text: 'BEAMFORMING', position: v(0, 2.38, 0), color});
    labels.push({text: 'SMART CITY', position: v(2.8, -0.45, 1.6), color: '#e2eaff'});
  }

  return {
    group,
    labels,
    update: (time, progress) => {
      reveals.forEach(({node, position, scale, delay}) => {
        const build = smooth((time - delay) / 0.68);
        node.visible = build > 0.001;
        node.position.copy(position);
        node.position.y -= (1 - build) * 1.2;
        node.scale.copy(scale).multiplyScalar(Math.max(0.001, build));
      });
      ticks.forEach((tick) => tick(time, progress));
    },
    dispose: () => disposeGroup(group),
  };
};
