import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 1983：TCP 三次握手——SYN / SYN-ACK / ACK 三段箭头依次点亮 */
export const TcpHandshake: React.FC<{progress: number; frame: number}> = ({
  progress,
  frame,
}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('协议统一');
  const cy = height * 0.42;
  const left = width * 0.3;
  const right = width * 0.7;
  const gap = 110;

  const steps = [
    {label: 'SYN', from: left, to: right, dir: 1, seq: 'seq=1000'},
    {label: 'SYN-ACK', from: right, to: left, dir: -1, seq: 'seq=5000 ack=1001'},
    {label: 'ACK', from: left, to: right, dir: 1, seq: 'seq=1001 ack=5001'},
  ];

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowC" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrowC" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>

      {/* 时间轴虚线 */}
      <line
        x1={left}
        y1={cy}
        x2={left}
        y2={cy + gap * 3 + 30}
        stroke="rgba(120,170,240,0.25)"
        strokeWidth={1.5}
        strokeDasharray="5 5"
      />
      <line
        x1={right}
        y1={cy}
        x2={right}
        y2={cy + gap * 3 + 30}
        stroke="rgba(120,170,240,0.25)"
        strokeWidth={1.5}
        strokeDasharray="5 5"
      />

      {/* 两端主机 */}
      {[
        {x: left, name: 'CLIENT'},
        {x: right, name: 'SERVER'},
      ].map((h) => (
        <g key={h.name}>
          <rect
            x={h.x - 60}
            y={cy - 44}
            width={120}
            height={50}
            rx={5}
            fill="rgba(10,25,50,0.92)"
            stroke={color}
            strokeWidth={2}
            filter="url(#mtGlowC)"
          />
          <text
            x={h.x}
            y={cy - 14}
            textAnchor="middle"
            fill={color}
            fontSize={17}
            fontFamily="Consolas, monospace"
            fontWeight={700}
          >
            {h.name}
          </text>
        </g>
      ))}

      {/* 三次握手（常驻） */}
      {steps.map((s, i) => {
        const start = i * 0.28;
        // 完成后保持完整箭头
        const grow = Math.max(1, mapRange(progress, start, start + 0.22, 0, 1));
        const y = cy + gap * (i + 0.6);
        const x1 = s.from;
        const x2 = s.from + (s.to - s.from) * grow;
        const done = grow >= 1;
        return (
          <g key={s.label} opacity={0.25 + grow * 0.75}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={color}
              strokeWidth={2.5}
              markerEnd={done ? 'url(#arrowC)' : undefined}
              filter="url(#mtGlowC)"
            />
            {/* 包体 */}
            {grow > 0.05 && grow < 1 && (
              <rect
                x={x2 - 16}
                y={y - 9}
                width={32}
                height={18}
                rx={3}
                fill={color}
                filter="url(#mtGlowC)"
              />
            )}
            {/* 标签 */}
            <text
              x={(x1 + x2) / 2}
              y={y - 12}
              textAnchor="middle"
              fill={done ? '#ffffff' : color}
              fontSize={19}
              fontFamily="Consolas, monospace"
              fontWeight={700}
            >
              {s.label}
            </text>
            <text
              x={(x1 + x2) / 2}
              y={y + 24}
              textAnchor="middle"
              fill="rgba(160,200,240,0.75)"
              fontSize={13}
              fontFamily="Consolas, monospace"
              opacity={done ? 1 : 0}
            >
              {s.seq}
            </text>
            {/* 完成闪光 */}
            {done && (
              <circle
                cx={s.to}
                cy={y}
                r={6 + Math.sin(frame / 14 + i) * 3}
                fill="#ffffff"
                opacity={0.6}
              />
            )}
          </g>
        );
      })}

      {/* 建立成功标记 */}
      {progress > 0.9 && (
        <text
          x={width / 2}
          y={cy + gap * 3 + 70}
          textAnchor="middle"
          fill={color}
          fontSize={22}
          fontFamily="Consolas, monospace"
          fontWeight={700}
          opacity={mapRange(progress, 0.9, 1, 0, 1)}
          filter="url(#mtGlowC)"
        >
          ESTABLISHED
        </text>
      )}
    </svg>
  );
};
