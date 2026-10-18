import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange, mulberry} from '../../lib/fx';

/** 2012：IPv6 地址海——IPv4 地址池枯竭，IPv6 十六进制地址如潮水涌现 */
export const Ipv6Sea: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('万物互联');
  const oldColor = '#ff7a7a';
  const rand = mulberry(2012);

  // 旧 IPv4 格子（少量，渐暗）
  const v4 = Array.from({length: 12}, () => ({
    x: rand() * width,
    y: height * 0.3 + rand() * height * 0.35,
    s: 16 + rand() * 14,
  }));

  // 新 IPv6 潮水（大量涌现）
  const v6Count = 90;
  const hex = '0123456789abcdef';
  const v6 = Array.from({length: v6Count}, (_, i) => {
    const r = mulberry(7000 + i);
    const txt = Array.from({length: 4}, () => hex[Math.floor(r() * 16)]).join(':') +
      Array.from({length: 4}, () => hex[Math.floor(r() * 16)]).join(':');
    return {
      x: r() * width,
      y: height * 0.28 + r() * height * 0.42,
      size: 13 + r() * 13,
      delay: r() * 0.55,
      drift: (r() - 0.5) * 30,
      txt,
    };
  });

  const v4Fade = 1 - mapRange(progress, 0.1, 0.45, 0, 1);

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowI" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* IPv4 枯竭格子 */}
      {v4.map((c, i) => (
        <g key={`v4${i}`} opacity={v4Fade}>
          <rect
            x={c.x}
            y={c.y}
            width={c.s}
            height={c.s}
            rx={2}
            fill="none"
            stroke={oldColor}
            strokeWidth={1.2}
          />
          <text x={c.x + c.s / 2} y={c.y + c.s / 2 + 4} textAnchor="middle" fill={oldColor} fontSize={10} fontFamily="Consolas, monospace">
            {Math.floor(c.x) % 256}
          </text>
          {/* 枯竭标记 */}
          {progress > 0.15 && progress < 0.5 && (
            <line x1={c.x} y1={c.y} x2={c.x + c.s} y2={c.y + c.s} stroke={oldColor} strokeWidth={1.5} opacity={0.8} />
          )}
        </g>
      ))}

      {/* IPv6 潮水 */}
      {v6.map((c, i) => {
        const ap = mapRange(progress, c.delay, c.delay + 0.3, 0, 1);
        return (
          <text
            key={`v6${i}`}
            x={c.x + c.drift + Math.sin(frame / 50 + i) * 8}
            y={c.y + Math.cos(frame / 60 + i) * 6}
            fill={color}
            fontSize={c.size}
            fontFamily="Consolas, monospace"
            opacity={ap * 0.8}
            filter={i % 7 === 0 ? 'url(#mtGlowI)' : undefined}
          >
            {c.txt}
          </text>
        );
      })}

      {/* 计数增长的可视化：地址空间条 */}
      {progress > 0.6 && (
        <g>
          <rect x={width * 0.3} y={height * 0.78} width={width * 0.4} height={10} rx={5} fill="rgba(255,255,255,0.1)" />
          <rect
            x={width * 0.3}
            y={height * 0.78}
            width={width * 0.4 * mapRange(progress, 0.6, 0.95, 0, 1)}
            height={10}
            rx={5}
            fill={color}
            filter="url(#mtGlowI)"
          />
          <text x={width * 0.3} y={height * 0.78 - 10} fill="rgba(160,200,240,0.8)" fontSize={14} fontFamily="Consolas, monospace">
            IPv4 32-bit
          </text>
          <text x={width * 0.7} y={height * 0.78 - 10} textAnchor="end" fill={color} fontSize={14} fontFamily="Consolas, monospace" fontWeight={700}>
            IPv6 128-bit · 3.4×10³⁸
          </text>
        </g>
      )}
    </svg>
  );
};
