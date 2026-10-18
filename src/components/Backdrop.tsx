import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {MILESTONES, INTRO_DURATION, CHRONICLE_DURATION, eraColor} from '../data/milestones';

/** 深空网格背景 + 漂移光晕 + 扫描线 + 年代色温变化 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const drift = frame * 0.15;
  const glow1X = width * 0.3 + Math.sin(drift / 40) * 120;
  const glow1Y = height * 0.35 + Math.cos(drift / 55) * 90;
  const glow2X = width * 0.75 + Math.cos(drift / 48) * 140;
  const glow2Y = height * 0.7 + Math.sin(drift / 60) * 100;

  // 随年代推进的强调色
  const chronicleFrame = Math.max(0, frame - INTRO_DURATION);
  const progress = Math.min(1, chronicleFrame / CHRONICLE_DURATION);
  const eraIdx = Math.min(MILESTONES.length - 1, Math.floor(progress * MILESTONES.length));
  const era = MILESTONES[eraIdx].era;
  const hue1 = 195 + progress * 65;
  const hue2 = 265 - progress * 30;

  // 缓慢移动的水平扫描线
  const scanY = (frame * 3.2) % (height + 300) - 150;

  return (
    <AbsoluteFill style={{backgroundColor: '#050a16'}}>
      {/* 网格 */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(90,140,220,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(90,140,220,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: `translateY(${-((frame * 0.3) % 80)}px)`,
        }}
      />
      {/* 光晕 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 600px at ${glow1X}px ${glow1Y}px, hsla(${hue1},85%,55%,0.16), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 700px at ${glow2X}px ${glow2Y}px, hsla(${hue2},85%,58%,0.13), transparent 70%)`,
        }}
      />
      {/* 水平扫描线（示波器感） */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, transparent, hsla(${hue1},90%,70%,0.05) 50%, transparent)`,
          height: 2,
          top: scanY,
          boxShadow: `0 0 60px 20px hsla(${hue1},90%,60%,0.06)`,
        }}
      />
      {/* 暗角 */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(2,5,12,0.75) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
