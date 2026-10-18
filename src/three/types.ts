import type * as THREE from 'three';

export type SceneLabel = {text: string; position: THREE.Vector3; color?: string};
export type SceneRig = {
  group: THREE.Group;
  update: (time: number, progress: number) => void;
  dispose: () => void;
  labels?: SceneLabel[];
};
