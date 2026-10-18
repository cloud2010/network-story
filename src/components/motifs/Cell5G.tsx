import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange, mulberry} from '../../lib/fx';

type Cell = {x: number; y: number; r: number; phase: number};
type Device = {x: number; y: number; cell: number};

/** 2019：5G 蜂窝——六边形蜂窝阵列逐格点亮，海量终端接入，波束定向扫描 */
export const Cell5G: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('万物互联');
  const rand = mulberry(2019);

  // 六边形蜂窝网格
  const R = 86;
  const cells: Cell[] = [];
  const rows = 4;
  const cols = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: width * 0.5 + (c - (cols - 1) / 2) * R * 1.5 + (r % 2 === 1 ? R * 0.75 : 0),
        y: height * 0.42 + (r - (rows - 1) / 2) * R * 0.87,
        r: R * 0.86,
        phase: (r * cols + c) * 0.045,
      });
    }
  }

  // 终端设备
  const devices: Device[] = Array.from({length: 26}, () => {
    const cellIdx = Math.floor(rand() * cells.length);
    const cell = cells[cellIdx];
    const a = rand() * Math.PI * 2;
    const d = rand() * cell.r * 0.6;
    return {
      x: cell.x + Math.cos(a) * d,
      y: cell.y + Math.sin(a) * d,
      cell: cellIdx,
    };
  });

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowJ" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 蜂窝（常驻） */}
      {cells.map((cell, i) => {
        const ap = Math.max(1, mapRange(progress, cell.phase, cell.phase + 0.16, 0, 1));
        const pts = Array.from({length: 6}, (_, k) => {
          const a = (Math.PI / 3) * k - Math.PI / 6;
          return `${cell.x + Math.cos(a) * cell.r * ap},${cell.y + Math.sin(a) * cell.r * ap}`;
        }).join(' ');
        return (
          <polygon
            key={i}
            points={pts}
            fill={color}
            fillOpacity={0.05 + 0.05 * Math.sin(frame / 25 + i)}
            stroke={color}
            strokeWidth={1.4}
            opacity={ap * 0.7}
          />
        );
      })}

      {/* 终端设备（常驻） */}
      {devices.map((d, i) => {
        const cell = cells[d.cell];
        const ap = Math.max(1, mapRange(progress, cell.phase + 0.12, cell.phase + 0.28, 0, 1));
        const blink = 0.4 + 0.6 * Math.abs(Math.sin(frame / 8 + i));
        return (
          <g key={i} opacity={ap}>
            <circle cx={d.x} cy={d.y} r={8} fill={color} opacity={0.2} />
            <circle cx={d.x} cy={d.y} r={3} fill="#ffffff" opacity={blink} filter="url(#mtGlowJ)" />
          </g>
        );
      })}

      {/* 波束扫描：从中心扇出的扫描线 */}
      {progress > 0.35 && (
        <g opacity={mapRange(progress, 0.35, 0.5, 0, 1)}>
          {Array.from({length: 3}).map((_, i) => {
            const ang = (frame * 0.02 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
            const len = Math.max(width, height) * 0.42;
            return (
              <line
                key={i}
                x1={width / 2}
                y1={height * 0.42}
                x2={width / 2 + Math.cos(ang) * len}
                y2={height * 0.42 + Math.sin(ang) * len}
                stroke={color}
                strokeWidth={2}
                opacity={0.28}
              />
            );
          })}
          <circle cx={width / 2} cy={height * 0.42} r={14} fill="#ffffff" filter="url(#mtGlowJ)" />
        </g>
      )}

      {/* 速率条 */}
      {progress > 0.65 && (
        <g>
          {Array.from({length: 10}).map((_, i) => {
            const fill = mapRange(progress, 0.65 + i * 0.02, 0.75 + i * 0.02, 0, 1);
            return (
              <rect
                key={i}
                x={width * 0.5 - 190 + i * 40}
                y={height * 0.82 - i * 4}
                width={28}
                height={8 + i * 4}
                rx={2}
                fill={color}
                opacity={fill * 0.85}
              />
            );
          })}
          <text
            x={width * 0.5}
            y={height * 0.82 + 30}
            textAnchor="middle"
            fill={color}
            fontSize={16}
            fontFamily="Consolas, monospace"
            fontWeight={700}
            opacity={mapRange(progress, 0.8, 0.95, 0, 1)}
          >
            eMBB · uRLLC · mMTC
          </text>
        </g>
      )}
    </svg>
  );
};
