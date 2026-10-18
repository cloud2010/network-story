import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange, mulberry} from '../../lib/fx';

type WN = {x: number; y: number};

/** 1989：超文本链接网——节点与超链接自发蔓延，鼠标悬停高亮 */
export const HyperWeb: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('万维网');
  const rand = mulberry(1989);
  const N = 14;
  const nodes: WN[] = [];
  for (let i = 0; i < N; i++) {
    nodes.push({
      x: width * (0.24 + rand() * 0.52),
      y: height * (0.28 + rand() * 0.34),
    });
  }

  const links: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    const deg = 1 + Math.floor(rand() * 2);
    for (let d = 0; d < deg; d++) {
      const j = Math.floor(rand() * N);
      if (j !== i) links.push([i, j]);
    }
  }

  const hoverIdx = Math.floor(progress * (N - 1));

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowE" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 超链接 */}
      {links.map(([a, b], i) => {
        const lp = mapRange(progress, i * 0.03, i * 0.03 + 0.2, 0, 1);
        const hot = a === hoverIdx || b === hoverIdx;
        return (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[a].x + (nodes[b].x - nodes[a].x) * lp}
            y2={nodes[a].y + (nodes[b].y - nodes[a].y) * lp}
            stroke={hot ? '#ffffff' : color}
            strokeWidth={hot ? 2.4 : 1.4}
            opacity={hot ? 0.95 : 0.35}
            filter={hot ? 'url(#mtGlowE)' : undefined}
          />
        );
      })}

      {/* 页面节点（常驻） */}
      {nodes.map((n, i) => {
        const appear = Math.max(0.9, mapRange(progress, i * 0.04, i * 0.04 + 0.15, 0, 1));
        const hot = i === hoverIdx;
        const w = hot ? 96 : 72;
        const h = hot ? 62 : 46;
        return (
          <g key={i} opacity={appear}>
            <rect
              x={n.x - w / 2}
              y={n.y - h / 2}
              width={w}
              height={h}
              rx={4}
              fill={hot ? 'rgba(60,60,120,0.95)' : 'rgba(10,25,50,0.9)'}
              stroke={hot ? '#ffffff' : color}
              strokeWidth={hot ? 2.4 : 1.5}
              filter="url(#mtGlowE)"
            />
            {/* 标题条 */}
            <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={7} rx={3} fill={color} opacity={0.55} />
            {/* 正文行 */}
            {[0, 1, 2].map((r) => (
              <line
                key={r}
                x1={n.x - w / 2 + 8}
                y1={n.y - h / 2 + 16 + r * 8}
                x2={n.x + w / 2 - 8 - (r === 2 ? 14 : 0)}
                y2={n.y - h / 2 + 16 + r * 8}
                stroke={color}
                strokeWidth={2}
                opacity={0.4}
              />
            ))}
          </g>
        );
      })}

      {/* 链接点击涟漪 */}
      {progress > 0.7 && (
        <circle
          cx={nodes[hoverIdx].x}
          cy={nodes[hoverIdx].y}
          r={20 + ((frame * 2.2) % 60)}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          opacity={Math.max(0, 0.7 - ((frame * 2.2) % 60) / 90)}
        />
      )}
    </svg>
  );
};
