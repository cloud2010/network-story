import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 1969：4 台主机星型互联，数据包在连线上穿梭，节点逐个点亮 */
export const ArpanetTerminals: React.FC<{progress: number; frame: number}> = ({
  progress,
  frame,
}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('网络起源');
  const cx = width / 2;
  const cy = height * 0.42;
  const R = Math.min(width, height) * 0.26;

  const nodes = [
    {x: cx, y: cy - R, label: 'UCLA'},
    {x: cx + R, y: cy, label: 'SRI'},
    {x: cx, y: cy + R, label: 'UCSB'},
    {x: cx - R, y: cy, label: 'UTAH'},
  ];

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowA" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 主机间连线（从中心扩散） */}
      {nodes.map((n, i) => {
        const lp = mapRange(progress, i * 0.08, i * 0.08 + 0.3, 0, 1);
        const ex = cx + (n.x - cx) * lp;
        const ey = cy + (n.y - cy) * lp;
        return (
          <line
            key={`l${i}`}
            x1={cx}
            y1={cy}
            x2={ex}
            y2={ey}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            filter="url(#mtGlowA)"
          />
        );
      })}

      {/* 中心集线器脉冲 */}
      <circle cx={cx} cy={cy} r={10 + progress * 6} fill="#ffffff" filter="url(#mtGlowA)" />
      <circle
        cx={cx}
        cy={cy}
        r={26 + Math.sin(frame / 18) * 6}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.4}
      />

      {/* 主机节点（常驻） */}
      {nodes.map((n, i) => {
        const appear = Math.max(0.9, mapRange(progress, i * 0.1, i * 0.1 + 0.25, 0, 1));
        const blink = 0.6 + 0.4 * Math.sin(frame / 12 + i * 2);
        return (
          <g key={`n${i}`} opacity={appear}>
            <rect
              x={n.x - 34}
              y={n.y - 22}
              width={68}
              height={44}
              rx={4}
              fill="rgba(10,25,50,0.9)"
              stroke={color}
              strokeWidth={2}
              filter="url(#mtGlowA)"
            />
            <rect
              x={n.x - 27}
              y={n.y - 15}
              width={54}
              height={30}
              rx={2}
              fill={color}
              opacity={0.12 + blink * 0.1}
            />
            {/* 扫描线 */}
            <line
              x1={n.x - 27}
              y1={n.y - 15 + ((frame * 2 + i * 30) % 30)}
              x2={n.x + 27}
              y2={n.y - 15 + ((frame * 2 + i * 30) % 30)}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
            <text
              x={n.x}
              y={n.y + 42}
              textAnchor="middle"
              fill={color}
              fontSize={20}
              fontFamily="Consolas, monospace"
            >
              {n.label}
            </text>
          </g>
        );
      })}

      {/* 数据包沿线穿梭 */}
      {progress > 0.4 &&
        nodes.map((n, i) => {
          const t = ((frame * 0.012 + i * 0.25) % 1);
          const px = cx + (n.x - cx) * t;
          const py = cy + (n.y - cy) * t;
          return (
            <g key={`p${i}`}>
              <circle cx={px} cy={py} r={7} fill={color} opacity={0.3} />
              <circle cx={px} cy={py} r={3} fill="#ffffff" />
            </g>
          );
        })}
    </svg>
  );
};
