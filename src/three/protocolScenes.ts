import * as THREE from 'three';
import {disposeGroup, glowMaterial, link, orb, terminal} from './primitives';
import type {SceneRig} from './types';

type ProtocolKind = 'handshake' | 'dns' | 'web' | 'browser' | 'ipv6';
type Motion = (time: number, progress: number) => void;

const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const smooth = (value: number): number => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const point = (x: number, y: number, z = 0): THREE.Vector3 => new THREE.Vector3(x, y, z);

const metal = (color = '#1b3040'): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({color, metalness: 0.72, roughness: 0.3});

const box = (
  parent: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
};

const outline = (mesh: THREE.Mesh, color: string, opacity = 0.45): void => {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({color, transparent: true, opacity}),
  );
  mesh.add(edges);
};

const pedestal = (parent: THREE.Group, x: number, z: number, color: string, radius = 1): THREE.Mesh => {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.08, 0.17, 48), metal('#12212e'));
  base.position.set(x, -2.08, z);
  parent.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.97, 0.025, 6, 64), glowMaterial(color));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(x, -1.98, z);
  parent.add(rim);
  return rim;
};

const server = (color: string, rows = 4): THREE.Group => {
  const group = new THREE.Group();
  const body = box(group, [1.12, 1.7, 0.82], [0, 0.85, 0], metal());
  outline(body, color, 0.32);
  box(group, [0.92, 1.46, 0.03], [0, 0.85, 0.43], metal('#09131d'));
  for (let row = 0; row < rows; row++) {
    const y = 0.3 + row * (1.1 / Math.max(1, rows - 1));
    box(group, [0.76, 0.19, 0.05], [0, y, 0.46], metal('#253c4b'));
    box(group, [0.045, 0.07, 0.035], [-0.26, y, 0.5], glowMaterial(color, 1.3));
    for (let vent = 0; vent < 3; vent++) {
      box(group, [0.12, 0.015, 0.035], [0.12, y - 0.05 + vent * 0.05, 0.5], glowMaterial('#7b9ca8', 0.45));
    }
  }
  return group;
};

const tube = (
  parent: THREE.Group,
  curve: THREE.Curve<THREE.Vector3>,
  color: string,
  radius = 0.025,
  opacity = 0.65,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 72, radius, 7, false),
    new THREE.MeshBasicMaterial({color, transparent: true, opacity, toneMapped: false}),
  );
  parent.add(mesh);
  return mesh;
};

const rig = (group: THREE.Group, update: Motion, labels: SceneRig['labels'] = []): SceneRig => ({
  group,
  update,
  dispose: () => disposeGroup(group),
  labels,
});

const handshakeScene = (color: string): SceneRig => {
  const group = new THREE.Group();
  const client = terminal(color);
  client.position.set(-4.05, -1.7, 0.1);
  client.rotation.y = 0.17;
  client.scale.setScalar(1.2);
  group.add(client);
  const host = server(color, 4);
  host.position.set(4.05, -1.95, 0);
  host.rotation.y = -0.21;
  host.scale.set(1.2, 1.4, 1.2);
  group.add(host);
  const rims = [pedestal(group, -4.05, 0.1, color, 1.25), pedestal(group, 4.05, 0, color, 1.18)];

  const heights = [2.45, 1.2, -0.02];
  const colors = [color, '#ffcf7a', '#9bffcb'];
  const routes = heights.map((height, i) => {
    const z = -0.2 + i * 0.48;
    const curve = new THREE.CubicBezierCurve3(
      point(-3.35, -0.2 + i * 0.08, z),
      point(-1.9, height, z),
      point(1.9, height, z),
      point(3.38, 0.1 + i * 0.06, z),
    );
    const dark = tube(group, curve, '#294454', 0.042, 0.8);
    const bright = tube(group, curve, colors[i], 0.018, 0.7);
    const packet = orb(colors[i], 0.115);
    group.add(packet);
    return {curve, dark, bright, packet};
  });

  const dataCurve = new THREE.CubicBezierCurve3(point(-3.4, -0.9, 0.4), point(-1.8, -1.35, 2), point(1.8, -1.35, 2), point(3.4, -0.8, 0.4));
  tube(group, dataCurve, color, 0.022, 0.35);
  const stream = Array.from({length: 11}, () => {
    const packet = orb('#bcffe8', 0.055);
    group.add(packet);
    return packet;
  });

  return rig(group, (time, progress) => {
    routes.forEach((route, i) => {
      const start = 0.06 + i * 0.2;
      const travel = clamp((progress - start) / 0.19);
      const active = progress >= start && progress <= start + 0.22;
      const finished = progress > start + 0.19;
      route.packet.position.copy(route.curve.getPoint(i === 1 ? 1 - travel : travel));
      route.packet.visible = active;
      const mat = route.bright.material as THREE.MeshBasicMaterial;
      mat.opacity = finished ? 0.95 : active ? 0.65 + Math.sin(time * 13) * 0.25 : 0.1;
      route.bright.scale.setScalar(1);
    });
    const connected = smooth((progress - 0.65) / 0.15);
    stream.forEach((packet, i) => {
      packet.visible = connected > 0.05;
      const phase = (time * 0.43 + i / stream.length) % 1;
      packet.position.copy(dataCurve.getPoint(phase));
      packet.scale.setScalar(connected * (0.75 + 0.3 * Math.sin(phase * Math.PI)));
    });
    rims.forEach((rim, i) => {rim.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.025 * connected);});
  }, [
    {text: 'CLIENT', position: point(-4.15, -2.6, 0.6), color},
    {text: 'SERVER', position: point(4.05, -2.6, 0.6), color},
    {text: '01  SYN', position: point(-0.1, 2.4, 0), color: colors[0]},
    {text: '02  SYN + ACK', position: point(-0.1, 1.2, 0.45), color: colors[1]},
    {text: '03  ACK', position: point(-0.1, 0.15, 0.9), color: colors[2]},
  ]);
};

const dnsScene = (color: string): SceneRig => {
  const group = new THREE.Group();
  const positions = [
    point(0, 2.3, -0.9),
    point(-2.45, 0.55, -0.7), point(2.45, 0.55, -0.7),
    point(-4.5, -1.4, 0.5), point(-1.5, -1.4, 0.5), point(1.5, -1.4, 0.5), point(4.5, -1.4, 0.5),
  ];
  const nodes = positions.map((position, i) => {
    const node = server(i === 0 ? '#ffce83' : color, 2);
    node.scale.setScalar(i === 0 ? 0.57 : 0.52);
    node.position.copy(position);
    group.add(node);
    return node;
  });
  const branches = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  const paths = branches.map(([from, to], index) => {
    const start = positions[from].clone().add(point(0, 0.1, 0.08));
    const end = positions[to].clone().add(point(0, 0.85, 0.1));
    const curve = new THREE.CubicBezierCurve3(start, start.clone().add(point(0, -0.65, 0.2)), end.clone().add(point(0, 0.6, 0.1)), end);
    tube(group, curve, '#355468', 0.045, 0.8);
    const live = tube(group, curve, index === 1 || index === 5 ? color : '#55788a', 0.018, index === 1 || index === 5 ? 0.9 : 0.25);
    return {curve, live};
  });
  for (let i = 3; i < 7; i++) pedestal(group, positions[i].x, positions[i].z, i === 6 ? color : '#375566', 0.72);

  const query = orb('#ffce83', 0.12);
  const response = orb(color, 0.12);
  group.add(query, response);
  const result = new THREE.Group();
  result.position.copy(positions[6]).add(point(0, 0.75, 0));
  const resultHalo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 7, 72), glowMaterial(color));
  resultHalo.rotation.x = Math.PI / 2;
  result.add(resultHalo);
  const resultPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 2.5, 32, 1, true), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
  resultPillar.position.y = 0.6;
  result.add(resultPillar);
  group.add(result);

  return rig(group, (time, progress) => {
    const descent = clamp((progress - 0.12) / 0.45) * 2;
    query.visible = progress > 0.1 && progress < 0.58;
    query.position.copy(paths[descent < 1 ? 1 : 5].curve.getPoint(descent < 1 ? descent : Math.min(descent - 1, 1)));
    const ascent = clamp((progress - 0.58) / 0.3) * 2;
    response.visible = progress >= 0.58 && progress < 0.9;
    response.position.copy(paths[ascent < 1 ? 5 : 1].curve.getPoint(ascent < 1 ? 1 - ascent : Math.max(2 - ascent, 0)));
    paths.forEach(({live}, index) => {
      if (index === 1 || index === 5) (live.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(time * 5 - index) * 0.2;
    });
    const found = smooth((progress - 0.48) / 0.18);
    result.scale.setScalar(Math.max(0.001, found));
    resultHalo.rotation.z = time * 0.3;
    resultHalo.position.y = Math.sin(time * 2) * 0.1;
    nodes[6].position.y = positions[6].y + found * Math.sin(time * 2.4) * 0.05;
  }, [
    {text: 'ROOT  .', position: point(0, 3.7, -0.8), color: '#ffce83'},
    {text: '.ORG', position: point(-2.6, 1.7, -0.6), color: '#7e9caf'},
    {text: '.COM', position: point(2.5, 1.7, -0.6), color},
    {text: 'NAME → IP', position: point(4.55, -2.6, 0.5), color},
  ]);
};

const document = (color: string, width = 1.5, height = 1.95): THREE.Group => {
  const group = new THREE.Group();
  const frame = box(group, [width, height, 0.08], [0, 0, 0], metal('#153241'));
  outline(frame, color, 0.7);
  box(group, [width - 0.14, height - 0.14, 0.025], [0, 0, 0.055], new THREE.MeshPhysicalMaterial({color: '#244f60', transparent: true, opacity: 0.62, roughness: 0.12, metalness: 0.25, clearcoat: 1}));
  box(group, [width * 0.59, 0.075, 0.03], [-width * 0.1, height * 0.33, 0.09], glowMaterial(color));
  for (let lineIndex = 0; lineIndex < 5; lineIndex++) {
    box(group, [width * (lineIndex % 3 === 1 ? 0.43 : 0.7), 0.035, 0.02], [-width * 0.05, height * 0.17 - lineIndex * 0.17, 0.095], glowMaterial(lineIndex === 1 || lineIndex === 4 ? color : '#849ca8', lineIndex === 1 || lineIndex === 4 ? 0.9 : 0.42));
  }
  box(group, [width * 0.56, 0.2, 0.028], [-width * 0.1, -height * 0.34, 0.095], new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.18}));
  return group;
};

const webScene = (color: string): SceneRig => {
  const group = new THREE.Group();
  const primary = document(color, 2, 2.65);
  primary.position.set(0, 0.35, 1.15);
  primary.rotation.y = -0.06;
  group.add(primary);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.018, 6, 96), glowMaterial(color, 0.6));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.65;
  group.add(ring);
  const positions = [point(-3.8, 1.65, -0.8), point(-3.8, -0.7, 0.3), point(-1.45, 2.5, -2.2), point(2, 2.4, -1.8), point(4, 0.7, -0.1), point(2.7, -1.15, 1.1)];
  const pages = positions.map((position, i) => {
    const page = document(i % 3 === 0 ? '#ffbe92' : color, 1.15, 1.55);
    page.position.copy(position);
    page.rotation.set(-0.04, (i % 2 ? -1 : 1) * 0.25, (i - 2) * 0.035);
    group.add(page);
    return page;
  });
  const connections = positions.map((position, i) => {
    const origin = primary.position.clone().add(point(i < 3 ? -0.9 : 0.9, 0.2 - (i % 3) * 0.38, 0));
    const target = position.clone();
    const curve = new THREE.CubicBezierCurve3(origin, origin.clone().lerp(target, 0.3).add(point(0, 0.5, 1)), origin.clone().lerp(target, 0.75).add(point(0, 0.5, 1)), target);
    const path = tube(group, curve, i % 3 === 0 ? '#ffbe92' : color, 0.022, 0.6);
    const packet = orb(i % 3 === 0 ? '#ffbe92' : color, 0.065);
    group.add(packet);
    return {curve, path, packet};
  });
  const crossLinks = [[0, 2], [2, 3], [3, 4], [1, 5], [4, 5]].map(([a, b]) => link(positions[a], positions[b], '#315364', 0.012));
  group.add(...crossLinks);
  return rig(group, (time, progress) => {
    primary.position.y = 0.35 + Math.sin(time * 1.3) * 0.07;
    pages.forEach((page, i) => {
      const reveal = smooth((progress - 0.08 - i * 0.07) / 0.22);
      page.scale.setScalar(Math.max(0.001, reveal));
      page.position.y = positions[i].y + Math.sin(time * 1.1 + i * 0.9) * 0.09;
      page.rotation.y = (i % 2 ? -1 : 1) * 0.25 + Math.sin(time * 0.6 + i) * 0.06;
      const connection = connections[i];
      connection.path.visible = reveal > 0.08;
      (connection.path.material as THREE.MeshBasicMaterial).opacity = reveal * 0.55;
      connection.packet.visible = reveal > 0.65;
      connection.packet.position.copy(connection.curve.getPoint((time * 0.27 + i * 0.17) % 1));
    });
    crossLinks.forEach((connection, i) => {connection.visible = progress > 0.48 + i * 0.035;});
    ring.rotation.z = time * 0.2;
  }, [
    {text: 'HYPERTEXT', position: point(0, -1.9, 1.5), color},
    {text: 'HTTP', position: point(-4, 2.8, -0.6), color},
    {text: 'ONE LINK. ANOTHER WORLD.', position: point(0.6, 3.7, -1), color: '#a4c6d4'},
  ]);
};

const browserScene = (color: string): SceneRig => {
  const group = new THREE.Group();
  const rearPages = [-1, 1].map((direction) => {
    const page = document('#83b9f0', 3.8, 3.3);
    page.position.set(direction * 2.2, 0.2, -1.3);
    page.rotation.y = direction * -0.26;
    page.rotation.z = direction * -0.08;
    group.add(page);
    return page;
  });
  const browser = new THREE.Group();
  browser.position.set(0, 0.15, 0.15);
  browser.rotation.y = -0.08;
  group.add(browser);
  const frame = box(browser, [6.45, 4.02, 0.24], [0, 0, 0], new THREE.MeshStandardMaterial({color: '#8b9ca9', metalness: 0.55, roughness: 0.3}));
  outline(frame, '#b9d9ee', 0.75);
  box(browser, [6.16, 3.72, 0.055], [0, -0.02, 0.15], new THREE.MeshStandardMaterial({color: '#d4d6ce', metalness: 0.08, roughness: 0.72}));
  box(browser, [6.14, 0.34, 0.06], [0, 1.67, 0.2], new THREE.MeshStandardMaterial({color: '#172b6a', emissive: '#254dab', emissiveIntensity: 0.28, roughness: 0.55}));
  box(browser, [5.25, 0.23, 0.04], [0.28, 1.18, 0.21], new THREE.MeshBasicMaterial({color: '#f1f3e8'}));
  for (let i = 0; i < 3; i++) {
    box(browser, [0.16, 0.16, 0.06], [2.55 + i * 0.2, 1.67, 0.25], new THREE.MeshStandardMaterial({color: '#c0c6c3', metalness: 0.2, roughness: 0.6}));
  }
  const navigation = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 3), glowMaterial('#3454ad'));
  navigation.rotation.z = Math.PI / 2;
  navigation.position.set(-2.7, 1.18, 0.25);
  browser.add(navigation);
  box(browser, [5.8, 2.55, 0.03], [0, -0.35, 0.21], new THREE.MeshStandardMaterial({color: '#f0eee3', roughness: 0.8}));
  const content = new THREE.Group();
  browser.add(content);
  box(content, [3.9, 0.16, 0.035], [-0.74, 0.65, 0.26], new THREE.MeshBasicMaterial({color: '#142966'}));
  box(content, [5.35, 0.018, 0.025], [0, 0.36, 0.26], new THREE.MeshBasicMaterial({color: '#9ba19f'}));
  const imageFrame = box(content, [2.3, 1.55, 0.12], [-1.5, -0.55, 0.32], new THREE.MeshStandardMaterial({color: '#0d2043', roughness: 0.28, metalness: 0.4}));
  outline(imageFrame, color, 0.5);
  box(content, [2.16, 1.4, 0.03], [-1.5, -0.55, 0.4], new THREE.MeshBasicMaterial({color: '#102443'}));
  const planet = new THREE.Group();
  planet.position.set(-1.5, -0.53, 0.78);
  content.add(planet);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.59, 3), new THREE.MeshStandardMaterial({color: '#3479c6', roughness: 0.37, metalness: 0.25, emissive: '#17365b', emissiveIntensity: 0.4, flatShading: true}));
  planet.add(globe);
  const globeGrid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.602, 2), new THREE.MeshBasicMaterial({color: '#a6d9ee', wireframe: true, transparent: true, opacity: 0.35}));
  planet.add(globeGrid);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.017, 6, 64), glowMaterial('#ffba8e'));
  orbit.rotation.x = 1.03;
  orbit.rotation.y = -0.3;
  planet.add(orbit);
  const textRows: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const width = i % 3 === 0 ? 2.28 : i % 3 === 1 ? 1.75 : 2.02;
    textRows.push(box(content, [width, i === 0 ? 0.075 : 0.045, 0.025], [0.18 + width / 2 - 0.1, 0.13 - i * 0.2, 0.29], new THREE.MeshBasicMaterial({color: i === 0 || i === 4 ? '#2d4faa' : '#788387'})));
  }
  const pointer = new THREE.Group();
  const pointerShape = new THREE.Shape();
  pointerShape.moveTo(0, 0);
  pointerShape.lineTo(0, -0.42);
  pointerShape.lineTo(0.12, -0.3);
  pointerShape.lineTo(0.2, -0.49);
  pointerShape.lineTo(0.29, -0.45);
  pointerShape.lineTo(0.2, -0.26);
  pointerShape.lineTo(0.37, -0.26);
  pointerShape.closePath();
  pointer.add(new THREE.Mesh(new THREE.ExtrudeGeometry(pointerShape, {depth: 0.04, bevelEnabled: false}), new THREE.MeshBasicMaterial({color: '#faffff'})));
  browser.add(pointer);
  const clickRing = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.017, 6, 40), glowMaterial(color));
  browser.add(clickRing);
  return rig(group, (time, progress) => {
    rearPages.forEach((page, i) => {
      const direction = i === 0 ? -1 : 1;
      page.position.x = direction * (1.7 + smooth(progress * 1.5) * 0.8);
      page.position.y = 0.2 + Math.sin(time + i) * 0.08;
    });
    const emerge = smooth((progress - 0.2) / 0.45);
    planet.rotation.y = time * 0.35;
    planet.position.z = 0.56 + emerge * 0.65;
    planet.scale.setScalar(0.8 + emerge * 0.26);
    textRows.forEach((row, i) => {row.scale.x = Math.max(0.001, smooth((progress - 0.08 - i * 0.025) / 0.18));});
    pointer.position.set(2.0 - smooth(progress / 0.6) * 0.7, 0.6 - smooth(progress / 0.6) * 1.2, 0.58);
    const pulse = ((time - 0.3) * 0.65) % 1;
    clickRing.position.copy(pointer.position).add(point(0.06, -0.06, -0.02));
    clickRing.scale.setScalar(0.4 + Math.max(0, pulse) * 1.9);
    (clickRing.material as THREE.MeshBasicMaterial).transparent = true;
    (clickRing.material as THREE.MeshBasicMaterial).opacity = progress > 0.4 ? (1 - Math.max(0, pulse)) * 0.75 : 0;
  }, [
    {text: 'NCSA MOSAIC', position: point(-1.65, 2.15, 0.7), color: '#b5d5ff'},
    {text: 'THE WEB BECOMES VISIBLE', position: point(0, -2.5, 1.1), color},
  ]);
};

const ipv6Scene = (color: string): SceneRig => {
  const group = new THREE.Group();
  const finite = new THREE.Group();
  finite.position.set(-3.5, 0.1, 0.8);
  finite.rotation.y = -0.1;
  group.add(finite);
  const finiteMaterial = new THREE.MeshStandardMaterial({color: '#ff9f5d', emissive: '#f77739', emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.28, transparent: true});
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) box(finite, [0.28, 0.28, 0.28], [(x - 1.5) * 0.4, (y - 1.5) * 0.4, 0], finiteMaterial);
  }
  const border = box(finite, [1.8, 1.8, 0.04], [0, 0, -0.2], new THREE.MeshBasicMaterial({color: '#ffac6b', transparent: true, opacity: 0.06}));
  outline(border, '#ffac6b', 0.8);

  const count = 720;
  const cubeGeometry = new THREE.BoxGeometry(0.066, 0.066, 0.066);
  const universe = new THREE.InstancedMesh(cubeGeometry, glowMaterial(color, 1.35), count);
  universe.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  universe.frustumCulled = false;
  group.add(universe);
  const initial: THREE.Vector3[] = [];
  const final: THREE.Vector3[] = [];
  const shades = ['#43a6ba', '#7df3f2', '#a9fff8', '#40959f'];
  for (let i = 0; i < count; i++) {
    const x = i % 12;
    const y = Math.floor(i / 12) % 6;
    const z = Math.floor(i / 72);
    initial.push(point(-3.5 + ((i % 4) - 1.5) * 0.4, 0.1 + ((Math.floor(i / 4) % 4) - 1.5) * 0.4, 0.8));
    final.push(point((x - 5.5) * 0.74 + 0.3, (y - 2.5) * 0.67 + 0.45, (z - 4.5) * 0.59));
    universe.setColorAt(i, new THREE.Color(shades[(x + y + z) % shades.length]));
  }
  const volume = new THREE.Group();
  group.add(volume);
  const wireMaterial = new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.12});
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.45, 3.64, 5.55)), wireMaterial);
  wire.position.set(0.3, 0.45, 0);
  volume.add(wire);
  for (const axis of [-1, 1]) {
    const arc = new THREE.EllipseCurve(0, 0, 4.85, 2.15, 0, Math.PI * 2, false, 0);
    const arcPoints = arc.getPoints(120).map((p) => point(p.x + 0.3, p.y * 0.35 - 1.65, p.y * axis));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
    volume.add(new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.25})));
  }
  const address = orb('#ffffff', 0.125);
  group.add(address);
  const addressRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022, 7, 48), glowMaterial('#ffffff'));
  group.add(addressRing);
  const proxy = new THREE.Object3D();
  const interpolated = new THREE.Vector3();
  return rig(group, (time, progress) => {
    const expansion = smooth((progress - 0.13) / 0.68);
    finiteMaterial.opacity = 1 - smooth((progress - 0.22) / 0.38);
    finite.visible = progress < 0.67;
    finite.scale.setScalar(1 + expansion * 0.13);
    for (let i = 0; i < count; i++) {
      const delay = ((i * 37) % count) / count * 0.2;
      const travel = smooth((expansion - delay) / (1 - delay));
      interpolated.copy(initial[i]).lerp(final[i], travel);
      proxy.position.copy(interpolated);
      proxy.rotation.set(time * 0.06 + i * 0.07, time * 0.08 + i * 0.11, 0);
      const scale = expansion < 0.01 ? 0.001 : 0.35 + travel * 0.65;
      proxy.scale.setScalar(scale);
      proxy.updateMatrix();
      universe.setMatrixAt(i, proxy.matrix);
    }
    universe.instanceMatrix.needsUpdate = true;
    volume.visible = expansion > 0.25;
    volume.scale.setScalar(Math.max(0.001, expansion));
    wireMaterial.opacity = expansion * 0.15;
    const target = final[485];
    address.position.copy(initial[485]).lerp(target, expansion);
    address.visible = progress > 0.25;
    address.scale.setScalar(0.5 + expansion * 0.6);
    addressRing.position.copy(address.position);
    addressRing.rotation.y = time * 0.5;
    addressRing.scale.setScalar((0.85 + Math.sin(time * 3) * 0.12) * expansion);
    addressRing.visible = progress > 0.4;
  }, [
    {text: 'IPv4 / 32 BIT', position: point(-3.8, -1.65, 1.3), color: '#ffac6b'},
    {text: 'IPv6 / 128 BIT', position: point(2.7, 3.3, 0.6), color},
    {text: '3.4 × 10³⁸ ADDRESSES', position: point(1.3, -2.35, 2.2), color: '#b9fffa'},
  ]);
};

export const createProtocolScene = (kind: ProtocolKind, color: string): SceneRig => {
  switch (kind) {
    case 'handshake': return handshakeScene(color);
    case 'dns': return dnsScene(color);
    case 'web': return webScene(color);
    case 'browser': return browserScene(color);
    case 'ipv6': return ipv6Scene(color);
  }
};
