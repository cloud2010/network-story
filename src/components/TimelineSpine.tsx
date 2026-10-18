import {useVideoConfig} from 'remotion';
import {
  MILESTONES,
  INTRO_DURATION,
  CHRONICLE_DURATION,
  MILESTONE_DURATION,
  eraColor,
} from '../data/milestones';
import {mulberry} from '../lib/fx';

type P = {x: number; y: number; r: number; phase: number};

/** 脊柱两侧的漂浮粒子（视差远景） */
const dust = (seed: number, count: number, w: number, h: number): P[] => {
  const rand = mulberry(seed);
  const arr: P[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: rand() * w,
      y: rand() * h,
      r: 0.8 + rand() * 2.4,
      phase: rand() * Math.PI * 2,
    });
  }
  return arr;
};

/**
 * 全局时间线脊柱：横向贯穿的主轴，10 个里程碑节点均布其上，
 * 进度随时间生长，数据包沿线流动，节点命中时爆发冲击环。
 */
export const TimelineSpine: React.FC<{
  /** 0~1 主进度 */
  progress: number;
  /** 当前活跃 milestone index（-1 表示无） */
  activeIndex: number;
  /** 当前帧（驱动流动动画） */
  frame: number;
  /** 里程碑命中后的爆发进度 0~1（命中瞬间为0，之后增长） */
  burst: number;
}> = ({progress, activeIndex, frame, burst}) => {
  const {width, height} = useVideoConfig();
  const cx = width / 2;
  // 脊柱置于画面下方，作为 motif 区与文字区的分隔线
  const cy = height * 0.7;
  const span = width * 0.78;
  const left = cx - span / 2;

  const nodes = MILESTONES.map((m, i) => ({
    x: left + (i / (MILESTONES.length - 1)) * span,
    color: eraColor(m.era),
    year: m.year,
  }));

  const dustA = dust(7, 70, width, height);
  const dustB = dust(31, 40, width, height);

  // 数据包：在主轴上流动，被"生长前沿"追逐
  const headX = left + span * progress;

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <linearGradient id="spineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4dd8ff" />
          <stop offset="50%" stopColor="#8a8dff" />
          <stop offset="100%" stopColor="#e06bff" />
        </linearGradient>
        <radialGradient id="burstGrad">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="spineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 远景尘埃 A（慢速视差） */}
      {dustA.map((d, i) => (
        <circle
          key={`da${i}`}
          cx={d.x + Math.sin(frame / 90 + d.phase) * 26}
          cy={d.y + Math.cos(frame / 120 + d.phase) * 18}
          r={d.r}
          fill="#7fb8ff"
          opacity={0.14 + 0.1 * Math.sin(frame / 40 + i)}
        />
      ))}
      {/* 中景尘埃 B */}
      {dustB.map((d, i) => (
        <circle
          key={`db${i}`}
          cx={d.x + Math.cos(frame / 60 + d.phase) * 40}
          cy={d.y + Math.sin(frame / 80 + d.phase) * 30}
          r={d.r * 1.5}
          fill="#a8d4ff"
          opacity={0.2 + 0.12 * Math.cos(frame / 30 + i)}
        />
      ))}

      {/* 主轴底轨 */}
      <line x1={left} y1={cy} x2={left + span} y2={cy} stroke="rgba(110,160,230,0.18)" strokeWidth={3} />

      {/* 主轴生长部分 */}
      <line
        x1={left}
        y1={cy}
        x2={headX}
        y2={cy}
        stroke="url(#spineGrad)"
        strokeWidth={4}
        filter="url(#spineGlow)"
      />

      {/* 生长前沿光晕 */}
      {progress > 0 && progress < 1 && (
        <>
          <circle cx={headX} cy={cy} r={22} fill="url(#burstGrad)" opacity={0.55} />
          <circle cx={headX} cy={cy} r={5} fill="#ffffff" filter="url(#spineGlow)" />
        </>
      )}

      {/* 流动数据包：沿已生长线段来回穿梭 */}
      {nodes.map((n, i) => {
        const nodeX = n.x;
        if (nodeX > headX) return null;
        const speed = 260 + i * 26;
        const spanPx = headX - left;
        const px = left + (((frame * speed) % Math.max(1, spanPx)));
        return (
          <g key={`pk${i}`}>
            <circle cx={px} cy={cy} r={9} fill={n.color} opacity={0.25} />
            <rect x={px - 10} y={cy - 1.5} width={20} height={3} fill={n.color} opacity={0.9} />
          </g>
        );
      })}

      {/* 里程碑节点 */}
      {nodes.map((n, i) => {
        const reached = n.x <= headX + 1;
        const isActive = i === activeIndex;
        // 节点脉冲
        const pulse = reached ? 1 + 0.25 * Math.sin(frame / 9 + i) : 0;
        const r = reached ? (isActive ? 13 : 8) * pulse : 5;
        return (
          <g key={`nd${i}`}>
            {reached && (
              <circle cx={n.x} cy={cy} r={r * 3.2} fill={n.color} opacity={isActive ? 0.16 : 0.08} />
            )}
            <circle
              cx={n.x}
              cy={cy}
              r={r}
              fill={reached ? '#ffffff' : 'rgba(140,180,240,0.35)'}
              stroke={n.color}
              strokeWidth={reached ? 2.5 : 1}
              filter={reached ? 'url(#spineGlow)' : undefined}
            />
            {/* 年份标签 */}
            <text
              x={n.x}
              y={cy - 26}
              textAnchor="middle"
              fill={reached ? n.color : 'rgba(140,180,240,0.4)'}
              fontSize={isActive ? 26 : 19}
              fontFamily="Consolas, monospace"
              fontWeight={isActive ? 700 : 400}
            >
              {n.year}
            </text>
            {/* 命中爆发环 */}
            {isActive && burst < 1 && (
              <>
                <circle
                  cx={n.x}
                  cy={cy}
                  r={13 + burst * 130}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={3 * (1 - burst)}
                  opacity={1 - burst}
                />
                <circle
                  cx={n.x}
                  cy={cy}
                  r={13 + burst * 200}
                  fill="none"
                  stroke={n.color}
                  strokeWidth={2 * (1 - burst)}
                  opacity={0.8 - burst * 0.8}
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
