import {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {MILESTONE_DURATION, INTRO_DURATION} from '../data/milestones';
import {localProgress, mulberry} from '../lib/fx';

/**
 * 摄影机层：给内容套上运镜（dolly/pan/roll）与故障转场。
 * 通过 transform 实现，不改变被包裹内容的渲染逻辑。
 */
export const Camera: React.FC<{
  frame: number;
  children: ReactNode;
}> = ({frame, children}) => {
  // 里程碑段内的相对帧
  const rel = frame - INTRO_DURATION;
  const segIndex = Math.floor(rel / MILESTONE_DURATION);
  const segLocal = rel - segIndex * MILESTONE_DURATION;
  const segDur = MILESTONE_DURATION;

  // 每个段落定义不同镜头运动（交替切换保持新鲜感）
  const move = segIndex % 5;

  // 入场推轨比例
  const inT = localProgress(segLocal, 0, segDur * 0.45);
  // 出场拉出比例
  const outT = localProgress(segLocal, segDur * 0.75, segDur);

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let rot = 0;

  switch (move) {
    case 0: // 缓慢推进
      scale = 1.0 + inT * 0.06 - outT * 0.02;
      break;
    case 1: // 由左向右横移
      tx = (inT - outT) * -70;
      scale = 1.02 + inT * 0.04;
      break;
    case 2: // 由右向左横移 + 轻微推进
      tx = (inT - outT) * 70;
      scale = 1.02 + inT * 0.05;
      break;
    case 3: // 拉远揭示
      scale = 1.09 - inT * 0.07 + outT * 0.03;
      ty = (inT - outT) * -22;
      break;
    case 4: // 轻微手持晃动 + 推进
    default: {
      const rand = mulberry(segIndex * 977 + Math.floor(segLocal / 6));
      const shake = 2.2;
      tx = (rand() - 0.5) * shake;
      ty = (rand() - 0.5) * shake;
      rot = (rand() - 0.5) * 0.25;
      scale = 1.03 + inT * 0.05 - outT * 0.02;
      break;
    }
  }

  // 故障转场：段落边界前 6 帧内触发
  const glitchZone = 6;
  const toNext = segDur - segLocal;
  const isBoundary = toNext <= glitchZone && segIndex < MILESTONE_DURATION * 1000;
  const gIntensity = isBoundary ? (glitchZone - toNext) / glitchZone : 0;

  // RGB 分离位移
  const rgbSplit = gIntensity * 14;
  // 水平切片撕裂
  const slices = 5;
  const rand = mulberry(Math.floor(frame * 3));
  const sliceOffsets = Array.from({length: slices}, () => (rand() - 0.5) * gIntensity * 90);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* 主画面 */}
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </AbsoluteFill>

      {/* 故障：RGB 分离（红蓝副本偏移叠加） */}
      {rgbSplit > 0.5 && (
        <>
          <AbsoluteFill
            style={{
              transform: `translateX(${rgbSplit}px) scale(${scale})`,
              mixBlendMode: 'screen',
              filter: 'url(#rgbRed)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          >
            {children}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              transform: `translateX(${-rgbSplit}px) scale(${scale})`,
              mixBlendMode: 'screen',
              filter: 'url(#rgbCyan)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          >
            {children}
          </AbsoluteFill>
        </>
      )}

      {/* 故障：水平撕裂条 */}
      {sliceOffsets.map((off, i) => {
        if (Math.abs(off) < 0.5) return null;
        const top = (i / slices) * 100;
        const h = 100 / slices;
        return (
          <AbsoluteFill
            key={i}
            style={{
              top: `${top}%`,
              height: `${h}%`,
              transform: `translateX(${off}px)`,
              mixBlendMode: 'screen',
              opacity: 0.6,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                height: `${slices * 100}%`,
                marginTop: `${-i * 100}%`,
              }}
            >
              {children}
            </div>
          </AbsoluteFill>
        );
      })}

      {/* 故障扫描线 */}
      {gIntensity > 0.3 && (
        <AbsoluteFill
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
