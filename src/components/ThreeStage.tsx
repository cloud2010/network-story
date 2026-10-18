import {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {INTRO_DURATION, CHRONICLE_DURATION, MILESTONES, MILESTONE_DURATION, TOTAL_FRAMES, OUTRO_DURATION} from '../data/milestones';
import {clamp, createShot, ease} from '../lib/motion';
import {createPhysicalScene} from '../three/physicalScenes';
import {createProtocolScene} from '../three/protocolScenes';
import {createWorldScene} from '../three/worldScene';
import {disposeGroup} from '../three/primitives';
import type {SceneRig} from '../three/types';

type Stage = {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  stars: THREE.Points;
  ring: THREE.Mesh;
  transit: THREE.Group;
  transitMaterial: THREE.MeshBasicMaterial;
  rig: SceneRig | null;
  key: number;
  shot: ReturnType<typeof createShot>;
};

export const ThreeStage: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const [handle] = useState(() => delayRender('Preparing the Three.js scene', {timeoutInMilliseconds: 90000}));

  useLayoutEffect(() => {
    if (!canvas.current) return;
    let current: Stage;
    try {
      const renderer = new THREE.WebGLRenderer({canvas: canvas.current, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(1);
      renderer.setClearColor('#070c10');
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#070c10');
      scene.fog = new THREE.FogExp2('#070c10', 0.018);
      const camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 130);
      camera.setViewOffset(width, height, -width * 0.16, 0, width, height);
      scene.add(new THREE.HemisphereLight('#cfecff', '#172b2d', 2.6));
      const keyLight = new THREE.DirectionalLight('#fff0d2', 4.0);
      keyLight.position.set(-3, 8, 6);
      scene.add(keyLight);
      const rim = new THREE.DirectionalLight('#80bfff', 4.2);
      rim.position.set(5, 4, -5);
      scene.add(rim);
      const soft = new THREE.PointLight('#b7ffde', 65, 28, 2);
      soft.position.set(-4, 5, 4);
      scene.add(soft);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({color: '#0b161a', roughness: 0.42, metalness: 0.35}));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.9;
      scene.add(floor);
      const grid = new THREE.GridHelper(45, 45, '#203439', '#122126');
      grid.position.y = -0.89;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.32;
      scene.add(grid);
      const ring = new THREE.Mesh(new THREE.RingGeometry(6.7, 6.72, 160), new THREE.MeshBasicMaterial({color: '#40696a', transparent: true, opacity: 0.35, side: THREE.DoubleSide}));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.88;
      scene.add(ring);
      const coords: number[] = [];
      for (let i = 0; i < 370; i++) {
        const a = i * 2.399963;
        coords.push(Math.sin(a) * (12 + (i % 17)), 1 + ((i * 7.31) % 18), Math.cos(a) * (12 + (i % 13)) - 10);
      }
      const starsGeometry = new THREE.BufferGeometry();
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
      const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({color: '#9bbec4', size: 0.026, transparent: true, opacity: 0.45}));
      scene.add(stars);
      const pivot = new THREE.Group();
      scene.add(pivot);
      const transit = new THREE.Group();
      const transitMaterial = new THREE.MeshBasicMaterial({color: '#a9eee4', transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false});
      for (let i = 0; i < 64; i++) {
        const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1.8, 5), transitMaterial);
        streak.rotation.x = Math.PI / 2;
        streak.userData.index = i;
        transit.add(streak);
      }
      camera.add(transit);
      scene.add(camera);
      const target = new THREE.WebGLRenderTarget(width, height, {type: THREE.HalfFloatType});
      target.samples = 4;
      const composer = new EffectComposer(renderer, target);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.46, 0.6, 0.85);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      current = {renderer, composer, bloom, scene, camera, pivot, stars, ring, transit, transitMaterial, rig: null, key: -99, shot: createShot()};
      stage.current = current;
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    return () => {
      if (current.rig) {
        current.pivot.remove(current.rig.group);
        current.rig.dispose();
      }
      current.shot.dispose();
      disposeGroup(current.scene);
      current.composer.passes.forEach(pass => pass.dispose());
      current.composer.dispose();
      current.renderer.dispose();
      stage.current = null;
    };
  }, [width, height]);

  useLayoutEffect(() => {
    const s = stage.current;
    if (!s) return;
    try {
      const intro = frame < INTRO_DURATION;
      const ending = frame >= INTRO_DURATION + CHRONICLE_DURATION;
      const index = intro ? -1 : ending ? 10 : Math.min(9, Math.floor((frame - INTRO_DURATION) / MILESTONE_DURATION));
      const localFrame = intro ? frame : ending ? frame - (TOTAL_FRAMES - OUTRO_DURATION) : frame - INTRO_DURATION - index * MILESTONE_DURATION;
      const time = localFrame / fps;
      const progress = clamp(localFrame / (intro ? INTRO_DURATION : ending ? OUTRO_DURATION : MILESTONE_DURATION));
      if (s.key !== index) {
        if (s.rig) {s.pivot.remove(s.rig.group); s.rig.dispose();}
        s.shot.dispose();
        s.shot = createShot();
        if (intro || ending) s.rig = createWorldScene(ending);
        else {
          const m = MILESTONES[index];
          s.rig = ['terminals', 'bus', 'wifi', 'mobile', 'cell5g'].includes(m.motif)
            ? createPhysicalScene(m.motif as Parameters<typeof createPhysicalScene>[0], m.accent)
            : createProtocolScene(m.motif as Parameters<typeof createProtocolScene>[0], m.accent);
        }
        s.pivot.add(s.rig.group);
        s.key = index;
        if (labels.current) {
          labels.current.replaceChildren();
          s.rig.labels?.forEach(label => {
            const node = document.createElement('div');
            node.textContent = label.text;
            Object.assign(node.style, {position: 'absolute', fontFamily: 'Consolas, monospace', fontSize: '15px', letterSpacing: '1.8px', whiteSpace: 'nowrap', color: label.color ?? '#b3ccd1', padding: '8px 12px', borderLeft: `2px solid ${label.color ?? MILESTONES[Math.max(0, index)]?.accent ?? '#aaf5cc'}`, background: 'rgba(5,13,18,0.75)', transform: 'translate(-50%, -50%)'});
            labels.current!.appendChild(node);
          });
        }
      }
      const shot = s.shot.at(time);
      s.rig!.update(time, progress);
      s.pivot.rotation.y = shot.orbit + (index === 4 ? -0.16 : index === 7 ? -0.08 : 0);
      s.pivot.position.y = (intro || ending) ? 1 : 1.65 + shot.lift;
      s.pivot.scale.setScalar((intro || ending) ? 1 : 0.96 + 0.12 * shot.reveal);
      // Different camera heights make each chapter read as a distinct physical space.
      const high = index === 1 || index === 9;
      const frontal = index === 5 || index === 7;
      const cameraX = frontal ? 3 : high ? 7.6 : 6.2;
      const cameraY = frontal ? 3.0 : high ? 10.8 : 6.8;
      const cameraZ = frontal ? 20.2 : high ? 17.8 : 19.0;
      const distance = (intro || ending) ? 1.02 - ease(progress) * 0.06 : shot.zoom - progress * 0.06;
      s.camera.position.set(cameraX * distance, cameraY * distance, cameraZ * distance);
      s.camera.lookAt(0, 0.2, 0);
      s.camera.updateMatrixWorld();
      s.pivot.updateMatrixWorld(true);
      s.stars.rotation.y = frame * 0.00013;
      s.ring.visible = !intro && !ending;
      s.bloom.strength = ending ? 0.65 : index === 5 ? 0.14 : 0.43;
      const duration = intro ? INTRO_DURATION : ending ? OUTRO_DURATION : MILESTONE_DURATION;
      const transition = Math.max(intro ? 0 : clamp(1 - localFrame / 10), ending ? 0 : clamp((localFrame - duration + 10) / 10));
      s.transit.visible = transition > 0;
      s.transitMaterial.opacity = transition * 0.65;
      s.transitMaterial.color.set(intro || ending ? '#a9eee4' : MILESTONES[index].accent);
      s.transit.children.forEach((streak, i) => {
        const angle = i * 2.399963;
        const radius = 2 + (i % 9) * 0.5;
        const travel = ((frame * 0.075 + i * 0.137) % 1);
        streak.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.65, -36 + travel * 35);
        streak.scale.y = 0.8 + transition * 4;
      });
      s.composer.render(0);
      s.rig!.labels?.forEach((label, i) => {
        const node = labels.current?.children[i] as HTMLDivElement | undefined;
        if (!node) return;
        const point = s.rig!.group.localToWorld(label.position.clone()).project(s.camera);
        const x = (point.x + 1) * width / 2;
        const y = (1 - point.y) * height / 2;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.opacity = String(x > width * 0.43 && y > 150 && y < height * 0.72 && point.z < 1 ? ease((time - 0.6) / 0.5) * (1 - shot.exit) : 0);
      });
      continueRender(handle);
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
  }, [frame, fps, width, height, handle]);

  return <AbsoluteFill><canvas ref={canvas} width={width} height={height} style={{width: '100%', height: '100%'}} /><div ref={labels} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} /></AbsoluteFill>;
};
