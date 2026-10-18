import * as THREE from 'three';

export const glowMaterial = (color: string, intensity = 1): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false});

export const link = (a: THREE.Vector3, b: THREE.Vector3, color: string, radius = 0.025): THREE.Mesh => {
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), glowMaterial(color));
  mesh.position.copy(a).lerp(b, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
};

export const orb = (color: string, radius = 0.09): THREE.Group => {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), glowMaterial('#efffff', 1.5)));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.8, 12, 10), new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending}));
  group.add(halo);
  return group;
};

export const terminal = (color: string): THREE.Group => {
  const group = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({color: '#a6a796', roughness: 0.47, metalness: 0.22});
  const dark = new THREE.MeshStandardMaterial({color: '#111d21', roughness: 0.48, metalness: 0.7});
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.96, 0.95), shell);
  body.position.y = 0.48;
  group.add(body);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.76, 0.04), dark);
  bezel.position.set(0, 0.51, 0.5);
  group.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.58), new THREE.MeshStandardMaterial({color: '#092622', emissive: color, emissiveIntensity: 0.23, roughness: 0.3}));
  screen.position.set(0, 0.52, 0.526);
  group.add(screen);
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.30 + (i % 3) * 0.13, 0.018), glowMaterial(color));
    line.position.set(-0.12, 0.69 - i * 0.075, 0.529);
    group.add(line);
  }
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.6), shell);
  keyboard.position.set(0, -0.06, 0.65);
  keyboard.rotation.x = 0.07;
  group.add(keyboard);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.09), dark);
      key.position.set(-0.52 + col * 0.13, 0.02, 0.5 + row * 0.14);
      group.add(key);
    }
  }
  return group;
};

export const disposeGroup = (group: THREE.Object3D): void => {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => materials.add(m));
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
};
