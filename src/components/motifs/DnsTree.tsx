import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

type DN = {label: string; x: number; y: number; depth: number};

/** 1984：DNS 层级树——根、顶级域、二级域逐层展开，查询沿树下行 */
export const DnsTree: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('协议统一');
  const cx = width / 2;
  const top = height * 0.3;

  const nodes: DN[] = [
    {label: '.', x: cx, y: top, depth: 0},
    {label: 'com', x: cx - 200, y: top + 100, depth: 1},
    {label: 'edu', x: cx + 200, y: top + 100, depth: 1},
    {label: 'www', x: cx - 200, y: top + 200, depth: 2},
    {label: 'example', x: cx - 340, y: top + 200, depth: 2},
    {label: 'mit', x: cx + 200, y: top + 200, depth: 2},
    {label: 'example.com', x: cx - 270, y: top + 300, depth: 3},
    {label: 'mit.edu', x: cx + 200, y: top + 300, depth: 3},
  ];

  const links: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [3, 6],
    [5, 7],
  ];

  const queryPath = [0, 1, 3, 6];

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowD" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 层级连线 */}
      {links.map(([a, b], i) => {
        const lp = mapRange(progress, 0.05 + i * 0.05, 0.3 + i * 0.05, 0, 1);
        return (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[a].x + (nodes[b].x - nodes[a].x) * lp}
            y2={nodes[a].y + (nodes[b].y - nodes[a].y) * lp}
            stroke={color}
            strokeWidth={1.8}
            opacity={0.45}
          />
        );
      })}

      {/* 节点（常驻） */}
      {nodes.map((n, i) => {
        // 入场后保持终态
        const appear = Math.max(0.9, mapRange(progress, i * 0.06, i * 0.06 + 0.18, 0, 1));
        const isQuery = queryPath.includes(i);
        return (
          <g key={i} opacity={appear}>
            <rect
              x={n.x - 62}
              y={n.y - 20}
              width={124}
              height={40}
              rx={20}
              fill="rgba(10,25,50,0.92)"
              stroke={isQuery ? '#ffffff' : color}
              strokeWidth={isQuery ? 2.2 : 1.5}
              filter="url(#mtGlowD)"
            />
            <text
              x={n.x}
              y={n.y + 6}
              textAnchor="middle"
              fill={isQuery ? '#ffffff' : color}
              fontSize={16}
              fontFamily="Consolas, monospace"
              fontWeight={isQuery ? 700 : 400}
            >
              {n.label}
            </text>
          </g>
        );
      })}

      {/* 查询包沿 queryPath 下行 */}
      {progress > 0.5 &&
        queryPath.slice(0, -1).map((from, i) => {
          const to = queryPath[i + 1];
          const t = ((frame * 0.014 + i * 0.33) % 1);
          const px = nodes[from].x + (nodes[to].x - nodes[from].x) * t;
          const py = nodes[from].y + (nodes[to].y - nodes[from].y) * t;
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={9} fill={color} opacity={0.3} />
              <text x={px} y={py + 5} textAnchor="middle" fill="#04101f" fontSize={10} fontFamily="Consolas" fontWeight={700}>
                Q
              </text>
            </g>
          );
        })}
    </svg>
  );
};
