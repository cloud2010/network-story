import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import ts from 'typescript';

// Run the actual TypeScript scene factories in memory, without a bundle or GPU.
// This checks direct rendering against seeking backward on an existing scene.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const modules = new Map();
const load = (filename) => {
  const absolute = resolve(root, filename);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const module = {exports: {}};
  modules.set(absolute, module);
  const code = ts.transpileModule(readFileSync(absolute, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name === 'three') return THREE;
    if (name.startsWith('.')) return load(resolve(dirname(absolute), `${name}.ts`));
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
};

const {gsap} = require('gsap');
const {createShot} = load('src/lib/motion.ts');
const {createProtocolScene} = load('src/three/protocolScenes.ts');
const {createPhysicalScene} = load('src/three/physicalScenes.ts');
const {createWorldScene} = load('src/three/worldScene.ts');
const times = [0, 1 / 30, 0.5, 1.2, 2.9, 4.7, 149 / 30, 5];

const finite = (values, label) => {
  for (const value of values) assert(Number.isFinite(value), `${label}: non-finite value`);
  return Array.from(values);
};

const arrayHash = (values, label) => {
  finite(values, label);
  return createHash('sha256')
    .update(Buffer.from(values.buffer, values.byteOffset, values.byteLength))
    .digest('hex');
};

const resources = (rig) => {
  const geometries = new Set();
  const materials = new Set();
  rig.group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  return [...geometries, ...materials];
};

const trackDisposal = (rig) => {
  const tracked = new Map(resources(rig).map((resource) => [resource, 0]));
  assert(tracked.size > 0, 'Scene has no disposable resources');
  for (const resource of tracked.keys()) resource.addEventListener('dispose', () => tracked.set(resource, tracked.get(resource) + 1));
  return () => {
    const after = resources(rig);
    assert.equal(after.length, tracked.size, 'Updates created or removed GPU resources');
    assert(after.every((resource) => tracked.has(resource)), 'Updates replaced GPU resources');
    rig.dispose();
    for (const count of tracked.values()) assert.equal(count, 1, 'A geometry or material was not disposed exactly once');
  };
};

const snapshot = (rig) => {
  const nodes = [];
  rig.group.traverse((object) => {
    const geometry = object.geometry;
    if (geometry) {
      const {start, count} = geometry.drawRange;
      assert(Number.isInteger(start) && start >= 0, 'Invalid geometry draw-range start');
      if (Number.isFinite(count)) {
        const available = geometry.index?.count ?? geometry.attributes.position.count;
        assert(Number.isInteger(count) && count >= 0 && start + count <= available, 'Geometry draw range exceeds available vertices');
      }
    }
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    const materialState = materials.map((material) => Object.fromEntries([
      ...['opacity', 'transparent', 'visible', 'depthWrite', 'depthTest', 'blending', 'roughness', 'metalness', 'clearcoat', 'emissiveIntensity', 'linewidth', 'size', 'sizeAttenuation', 'wireframe', 'side', 'toneMapped'].map((key) => [key, material[key]]),
      ['color', material.color?.toArray()],
      ['emissive', material.emissive?.toArray()],
    ]));
    nodes.push({
      type: object.type,
      position: finite(object.position.toArray(), 'position'),
      quaternion: finite(object.quaternion.toArray(), 'quaternion'),
      scale: finite(object.scale.toArray(), 'scale'),
      visible: object.visible,
      children: object.children.length,
      materials: materialState,
      drawRange: geometry ? {...geometry.drawRange} : null,
      attributes: geometry ? Object.fromEntries(Object.entries(geometry.attributes).map(([name, attribute]) => [name, arrayHash(attribute.array, name)])) : null,
      instances: object.isInstancedMesh ? {count: object.count, matrix: arrayHash(object.instanceMatrix.array, 'instance matrix'), color: object.instanceColor ? arrayHash(object.instanceColor.array, 'instance color') : null} : null,
    });
  });
  rig.labels?.forEach((label) => finite(label.position.toArray(), 'label position'));
  return JSON.stringify(nodes);
};

const shotState = (state) => {
  const {reveal, orbit, lift, zoom, exit} = state;
  return JSON.stringify(finite([reveal, orbit, lift, zoom, exit], 'GSAP state'));
};

const scenes = [
  ...['handshake', 'dns', 'web', 'browser', 'ipv6'].map((kind) => [kind, () => createProtocolScene(kind, '#99edfa')]),
  ...['terminals', 'bus', 'wifi', 'mobile', 'cell5g'].map((kind) => [kind, () => createPhysicalScene(kind, '#99edfa')]),
  ['opening', () => createWorldScene(false)],
  ['closing', () => createWorldScene(true)],
];

let sceneChecks = 0;
let lifecycleChecks = 0;
const shot = createShot();
try {
  for (const time of times) {
    const direct = createShot();
    const expected = shotState(direct.at(time));
    direct.dispose();
    shot.at(4.95);
    shot.at(0);
    assert.equal(shotState(shot.at(time)), expected, `GSAP reverse seek differs at ${time}s`);
  }
  for (const [name, create] of scenes) {
    const existing = create();
    const disposeExisting = trackDisposal(existing);
    try {
      for (const time of times) {
        const direct = create();
        const disposeDirect = trackDisposal(direct);
        let expected;
        try {
          direct.update(time, time / 5);
          expected = snapshot(direct);
        } finally {
          disposeDirect();
          lifecycleChecks++;
        }
        existing.update(4.95, 0.99);
        existing.update(0, 0);
        existing.update(time, time / 5);
        assert(snapshot(existing) === expected, `${name}: reverse seek differs from direct rendering at ${time}s`);
        // Redrawing a paused Remotion frame must produce the same state too.
        existing.update(time, time / 5);
        assert(snapshot(existing) === expected, `${name}: repeated frame differs at ${time}s`);
        sceneChecks++;
      }
    } finally {
      disposeExisting();
      lifecycleChecks++;
    }
  }
  console.log(`Motion validation passed: ${times.length} GSAP seeks, ${sceneChecks} scene seeks/repeats, ${lifecycleChecks} resource lifecycles.`);
} finally {
  shot.dispose();
  gsap.ticker.sleep();
}
