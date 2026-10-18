import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 1973：总线式以太网——一条主干总线，多台主机挂载，帧信号沿总线广播 */
export const EthernetBus: React.FC<{progress: number; frame: number}> = ({
  progress,
  frame,
}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('网络起源');
  const cy = height * 0.42;
  const left = width * 0.2;
  const right = width * 0.8;
  const hosts = 5;

  const busGrow = mapRange(progress, 0, 0.3, 0, 1);
  const busX2 = left + (right - left) * busGrow;

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowB" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 主干总线（底层光晕 + 主线） */}
      <line
        x1={left}
        y1={cy}
        x2={busX2}
        y2={cy}
        stroke={color}
        strokeWidth={16}
        opacity={0.14}
      />
      <line
        x1={left}
        y1={cy}
        x2={busX2}
        y2={cy}
        stroke={color}
        strokeWidth={4}
        opacity={0.95}
      />
      {/* 总线能量脉冲 */}
      {busGrow > 0.9 && (
        <circle
          cx={left + ((frame * 6) % (right - left))}
          cy={cy}
          r={16}
          fill={color}
          opacity={0.25}
        />
      )}

      {/* 挂载主机（常驻） */}
      {Array.from({length: hosts}).map((_, i) => {
        const hx = left + (right - left) * (i / (hosts - 1));
        // 入场后保持终态：用 max 保证进度 1 时不归零
        const up = Math.max(0.85, mapRange(progress, 0.3 + i * 0.05, 0.5 + i * 0.05, 0, 1));
        const dir = i % 2 === 0 ? -1 : 1;
        const hy = cy + dir * 70 * up;
        const blink = 0.5 + 0.5 * Math.sin(frame / 10 + i);
        return (
          <g key={i} opacity={up}>
            {/* 挂载线 */}
            <line
              x1={hx}
              y1={cy}
              x2={hx}
              y2={hy}
              stroke={color}
              strokeWidth={2}
              opacity={0.6}
            />
            {/* 主机箱 */}
            <rect
              x={hx - 26}
              y={hy - 18}
              width={52}
              height={36}
              rx={3}
              fill="rgba(10,25,50,0.92)"
              stroke={color}
              strokeWidth={1.8}
              filter="url(#mtGlowB)"
            />
            {/* 指示灯 */}
            <circle cx={hx - 14} cy={hy - 6} r={3} fill={color} opacity={blink} />
            <circle cx={hx - 4} cy={hy - 6} r={3} fill={color} opacity={1 - blink} />
            {/* 数据槽 */}
            <rect x={hx - 14} y={hy + 4} width={28} height={6} rx={2} fill={color} opacity={0.35} />
          </g>
        );
      })}

      {/* 广播帧：沿总线左右各跑一次 */}
      {progress > 0.55 && (
        <>
          {[0, 1].map((dir) => {
            const t = ((frame * 0.02 + dir * 0.5) % 1);
            const px = dir === 0 ? left + (right - left) * t : right - (right - left) * t;
            return (
              <g key={dir}>
                <rect
                  x={px - 22}
                  y={cy - 8}
                  width={44}
                  height={16}
                  rx={2}
                  fill={color}
                  opacity={0.85}
                  filter="url(#mtGlowB)"
                />
                <text
                  x={px}
                  y={cy + 4}
                  textAnchor="middle"
                  fill="#04101f"
                  fontSize={11}
                  fontFamily="Consolas, monospace"
                  fontWeight={700}
                >
                  FRAME
                </text>
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
};
