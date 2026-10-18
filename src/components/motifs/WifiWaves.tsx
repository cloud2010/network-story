import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 1997：Wi-Fi 无线电波——同心波纹从路由器扩散，设备依次接入 */
export const WifiWaves: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('移动时代');
  const cx = width * 0.34;
  const cy = height * 0.42;

  const devices = [
    {x: width * 0.68, y: height * 0.3, label: 'PC', at: 0.35},
    {x: width * 0.76, y: height * 0.5, label: '手机', at: 0.5},
    {x: width * 0.66, y: height * 0.6, label: '平板', at: 0.65},
  ];
  // 全部接入后保持
  const allLinked = progress > 0.85;

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowG" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="waveGrad">
          <stop offset="60%" stopColor={color} stopOpacity="0" />
          <stop offset="92%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 路由器 */}
      <g>
        <rect
          x={cx - 55}
          y={cy - 18}
          width={110}
          height={36}
          rx={8}
          fill="rgba(10,25,50,0.95)"
          stroke={color}
          strokeWidth={2.2}
          filter="url(#mtGlowG)"
        />
        {/* 双天线 */}
        <line x1={cx - 32} y1={cy - 18} x2={cx - 44} y2={cy - 62} stroke={color} strokeWidth={3} />
        <line x1={cx + 32} y1={cy - 18} x2={cx + 44} y2={cy - 62} stroke={color} strokeWidth={3} />
        <circle cx={cx - 44} cy={cy - 62} r={4} fill={color} filter="url(#mtGlowG)" />
        <circle cx={cx + 44} cy={cy - 62} r={4} fill={color} filter="url(#mtGlowG)" />
        {/* 指示灯 */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={cx - 24 + i * 16}
            cy={cy}
            r={3.5}
            fill={color}
            opacity={0.4 + 0.6 * Math.abs(Math.sin(frame / 10 + i))}
          />
        ))}
        <text x={cx} y={cy + 40} textAnchor="middle" fill={color} fontSize={15} fontFamily="Consolas, monospace">
          802.11 AP
        </text>
      </g>

      {/* 扩散波纹 */}
      {progress > 0.15 &&
        [0, 1, 2, 3].map((i) => {
          const t = ((frame * 0.018 + i * 0.25) % 1);
          const r = 40 + t * 420;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={3 * (1 - t) + 0.5}
              opacity={0.55 * (1 - t)}
            />
          );
        })}

      {/* 中心能量场 */}
      <circle cx={cx} cy={cy} r={60} fill="url(#waveGrad)" opacity={mapRange(progress, 0, 0.3, 0, 1)} />

      {/* 接入设备（常驻） */}
      {devices.map((d, i) => {
        const ap = Math.max(0.9, mapRange(progress, d.at, d.at + 0.18, 0, 1));
        const linked = progress > d.at + 0.18 || allLinked;
        return (
          <g key={i} opacity={ap}>
            {/* 链路 */}
            {linked && (
              <line
                x1={cx}
                y1={cy}
                x2={d.x}
                y2={d.y}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                opacity={0.4 + 0.2 * Math.sin(frame / 12 + i)}
              />
            )}
            <rect
              x={d.x - 34}
              y={d.y - 22}
              width={68}
              height={44}
              rx={6}
              fill="rgba(10,25,50,0.92)"
              stroke={linked ? '#ffffff' : color}
              strokeWidth={linked ? 2.2 : 1.5}
              filter="url(#mtGlowG)"
            />
            <text x={d.x} y={d.y + 6} textAnchor="middle" fill={color} fontSize={15} fontFamily="Microsoft YaHei, sans-serif">
              {d.label}
            </text>
            {/* 信号格 */}
            {[0, 1, 2].map((b) => (
              <rect
                key={b}
                x={d.x - 14 + b * 11}
                y={d.y + 20 - b * 5}
                width={7}
                height={5 + b * 5}
                rx={1}
                fill={color}
                opacity={linked ? 0.9 : 0.25}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};
