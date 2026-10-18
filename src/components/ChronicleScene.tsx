import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {
  MILESTONES,
  INTRO_DURATION,
  CHRONICLE_DURATION,
  MILESTONE_DURATION,
  eraColor,
} from '../data/milestones';
import {localProgress, mapRange, fadeWindow} from '../lib/fx';
import {TimelineSpine} from './TimelineSpine';
import {Camera} from './Camera';
import {MotifRenderer} from './motifs';

/** 数字滚动：从上一帧值滚到目标年份 */
const RollingYear: React.FC<{
  from: number;
  to: number;
  progress: number;
  color: string;
}> = ({from, to, progress, color}) => {
  const v = Math.round(from + (to - from) * Math.min(1, Math.max(0, progress)));
  return (
    <div
      style={{
        fontFamily: 'Consolas, monospace',
        fontSize: 128,
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 0.95,
        letterSpacing: 4,
        textShadow: `0 0 60px ${color}88, 0 0 130px ${color}44`,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {v}
    </div>
  );
};

/** 8-56s：编年史主段 */
export const ChronicleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  if (frame < INTRO_DURATION || frame >= INTRO_DURATION + CHRONICLE_DURATION) return null;

  const rel = frame - INTRO_DURATION;
  const idx = Math.min(MILESTONES.length - 1, Math.floor(rel / MILESTONE_DURATION));
  const segStart = INTRO_DURATION + idx * MILESTONE_DURATION;
  const segLocal = frame - segStart;
  const m = MILESTONES[idx];
  const color = eraColor(m.era);

  // 全局进度（时间线生长）
  const globalProgress = Math.min(1, rel / CHRONICLE_DURATION);

  // 本段动画进度：入场动画在前 55% 完成并保持终态，退出前保持
  const motifProgress = localProgress(segLocal, 26, MILESTONE_DURATION * 0.55);
  const burst = localProgress(segLocal, 6, 70); // 命中爆发环

  // 文字编排
  const inT = localProgress(segLocal, 0, 22);
  const outT = localProgress(segLocal, MILESTONE_DURATION - 14, 14);
  const textOpacity = inT * (1 - outT);

  // 纪元标签滑入
  const eraX = interpolate(inT, [0, 1], [-60, 0]);
  // 标题分词滑入（逐字延迟）
  const titleChars = m.title.split('');
  // 描述上浮
  const descY = interpolate(inT, [0, 1], [40, 0]);

  // 年份滚动起点（上一个里程碑年份）
  const prevYear = idx > 0 ? MILESTONES[idx - 1].year : 1969;
  const yearRoll = localProgress(segLocal, 0, 30);

  // 侧边索引条
  const idxOpacity = fadeWindow(frame, segStart, segStart + MILESTONE_DURATION, 12, 12);

  return (
    <AbsoluteFill>
      {/* ===== 摄影机运镜 + 故障转场包裹层 ===== */}
      <Camera frame={frame}>
        <AbsoluteFill>
          {/* ===== 专属动态图形 motif（画面主体） ===== */}
          <div
            style={{
              opacity: inT,
              // 上移 motif，避开底部文字区与中央脊柱
              transform: 'translateY(-8%) scale(0.94)',
              transformOrigin: 'center center',
            }}
          >
            <MotifRenderer motif={m.motif} progress={motifProgress} frame={frame} />
          </div>

          {/* ===== 文字信息层 ===== */}
          <AbsoluteFill
            style={{
              alignItems: 'center',
              opacity: textOpacity,
              pointerEvents: 'none',
            }}
          >
            {/* 顶部：纪元标签 */}
            <div
              style={{
                position: 'absolute',
                top: height * 0.13,
                transform: `translateX(${eraX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: color,
                  transform: 'rotate(45deg)',
                  boxShadow: `0 0 16px ${color}`,
                }}
              />
              <div
                style={{
                  fontFamily: 'Microsoft YaHei, sans-serif',
                  fontSize: 30,
                  color,
                  letterSpacing: 14,
                  fontWeight: 600,
                }}
              >
                {m.era}
              </div>
              <div
                style={{
                  width: 120,
                  height: 1,
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                }}
              />
            </div>

            {/* 中部：滚动年份（右上角） */}
            <div
              style={{
                position: 'absolute',
                top: height * 0.1,
                right: width * 0.08,
                textAlign: 'right',
                opacity: inT * 0.95,
              }}
            >
              <RollingYear
                from={idx === 0 ? 1969 : prevYear}
                to={m.year}
                progress={yearRoll}
                color={color}
              />
            </div>

            {/* 底部信息卡 */}
            <div
              style={{
                position: 'absolute',
                bottom: height * 0.1,
                left: width * 0.1,
                right: width * 0.1,
                textAlign: 'center',
              }}
            >
              {/* 标题（逐字滑入） */}
              <div
                style={{
                  fontFamily: 'Microsoft YaHei, sans-serif',
                  fontSize: 66,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  textShadow: '0 0 44px rgba(120,180,255,0.55), 0 2px 14px rgba(0,0,0,0.9)',
                }}
              >
                {titleChars.map((ch, i) => {
                  const cp = localProgress(segLocal, 4 + i * 1.6, 14);
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        opacity: cp,
                        transform: `translateY(${(1 - cp) * 46}px) rotateX(${(1 - cp) * 90}deg)`,
                        whiteSpace: 'pre',
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>

              {/* 分隔线 */}
              <div
                style={{
                  width: 240 * localProgress(segLocal, 16, 34),
                  height: 2,
                  margin: '18px auto',
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  boxShadow: `0 0 14px ${color}`,
                }}
              />

              {/* 描述 */}
              <div
                style={{
                  fontFamily: 'Microsoft YaHei, sans-serif',
                  fontSize: 30,
                  color: '#a8cdf0',
                  letterSpacing: 3,
                  transform: `translateY(${descY}px)`,
                  opacity: localProgress(segLocal, 18, 40),
                  textShadow: '0 2px 20px rgba(0,0,0,0.9)',
                }}
              >
                {m.desc}
              </div>
            </div>

            {/* 左下：索引 */}
            <div
              style={{
                position: 'absolute',
                left: width * 0.06,
                bottom: height * 0.1,
                fontFamily: 'Consolas, monospace',
                fontSize: 22,
                color: 'rgba(150,195,245,0.75)',
                letterSpacing: 3,
                opacity: idxOpacity,
              }}
            >
              <span style={{color: '#ffffff', fontSize: 30, fontWeight: 700}}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              {' / '}
              {String(MILESTONES.length).padStart(2, '0')}
            </div>

            {/* 右下：年份刻度尺 */}
            <div
              style={{
                position: 'absolute',
                right: width * 0.06,
                bottom: height * 0.1,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 5,
                opacity: idxOpacity,
              }}
            >
              {MILESTONES.map((ms, i) => {
                const active = i === idx;
                const passed = i <= idx;
                return (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: active ? 34 : passed ? 20 : 10,
                      background: passed ? eraColor(ms.era) : 'rgba(120,170,240,0.25)',
                      boxShadow: active ? `0 0 12px ${eraColor(ms.era)}` : 'none',
                      transition: 'none',
                    }}
                  />
                );
              })}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </Camera>

      {/* ===== 全局时间线脊柱（不受运镜影响，始终稳定） ===== */}
      <TimelineSpine
        progress={globalProgress}
        activeIndex={idx}
        frame={frame}
        burst={burst}
      />
    </AbsoluteFill>
  );
};
