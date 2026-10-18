import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/** 确定性伪随机（同种子同结果，保证逐帧渲染一致） */
export const mulberry = (seed: number): (() => number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 帧内 0~1 进度，带 clamp */
export const localProgress = (
  frame: number,
  start: number,
  duration: number,
): number => {
  if (frame <= start) return 0;
  if (frame >= start + duration) return 1;
  return (frame - start) / duration;
};

/** 局部时间（秒）→ 该 milestone 内的 0~1 */
export const segProgress = (frame: number, startFrame: number, durFrame: number): number =>
  localProgress(frame, startFrame, durFrame);

/** 数值映射封装，避免每处都写 interpolate 参数 */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => interpolate(v, [inMin, inMax], [outMin, outMax]);

/** 淡入淡出窗口：inD 内淡入，末尾 outD 内淡出 */
export const fadeWindow = (
  frame: number,
  start: number,
  end: number,
  inD: number,
  outD: number,
): number => {
  const fadeIn = localProgress(frame, start, inD);
  const fadeOut = 1 - localProgress(frame, end - outD, outD);
  return Math.min(fadeIn, fadeOut);
};

/** 弹簧感缓动（近似 overshoot） */
export const overshoot = (t: number, power = 0.7): number => {
  const p = Math.min(1, Math.max(0, t));
  const c = power;
  return p === 1 ? 1 : 1 + c * Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3));
};

/** 当前帧的全局信息 */
export const useFrameInfo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: frame / fps};
};
