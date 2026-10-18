import {gsap} from 'gsap';

export const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const eases = new Map<string, (v: number) => number>();
export const ease = (value: number, name = 'power3.out'): number => {
  if (!eases.has(name)) eases.set(name, gsap.parseEase(name));
  return eases.get(name)!(clamp(value));
};

/** Seek a paused GSAP timeline from Remotion time; never advance on wall time. */
export const createShot = () => {
  const state = {reveal: 0, orbit: -0.3, lift: -0.5, zoom: 1.15, exit: 0};
  const timeline = gsap.timeline({paused: true});
  timeline.to(state, {reveal: 1, lift: 0, zoom: 1, duration: 1.05, ease: 'expo.out'}, 0);
  timeline.to(state, {orbit: 0.26, duration: 5, ease: 'power1.inOut'}, 0);
  timeline.to(state, {exit: 1, zoom: 0.93, duration: 0.35, ease: 'power2.in'}, 4.65);
  return {
    at: (seconds: number) => {
      timeline.totalTime(Math.min(5, Math.max(0, seconds)), true);
      return state;
    },
    dispose: () => timeline.kill(),
  };
};
