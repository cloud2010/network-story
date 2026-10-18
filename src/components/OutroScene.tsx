import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {INTRO_DURATION, CHRONICLE_DURATION, FPS} from '../data/milestones';
import {localProgress, mulberry} from '../lib/fx';

/** 56-60s：收尾——全球节点汇聚成一颗发光的星球，标语随心跳脉动 */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const start = INTRO_DURATION + CHRONICLE_DURATION;
  if (frame < start) return null;

  const local = frame - start;
  const cx = width / 2;
  const cy = height * 0.46;
  const R = Math.min(width, height) * 0.19;

  // 汇聚进度
  const converge = localProgress(local, 0, 1.6 * FPS);
  // 星球自转
  const spin = local / 22;
  // 标语
  const titleP = localProgress(local, 1.2 * FPS, 1.0 * FPS);
  const titleScale = 0.94 + titleP * 0.06;
  const subP = localProgress(local, 2.0 * FPS, 0.9 * FPS);
  // 心跳脉动
  const beat = 1 + 0.035 * Math.sin(local / 7) * Math.max(0, 1 - local / (3.5 * FPS));

  // 环绕轨道的节点（最终状态：全球互联）
  const rand = mulberry(2020);
  const orbitNodes = Array.from({length: 40}, () => {
    const a = rand() * Math.PI * 2;
    const rr = R * (1.4 + rand() * 1.5);
    return {
      a,
      r: rr,
      size: 2 + rand() * 4,
      hue: rand(),
      speed: 0.3 + rand() * 0.8,
    };
  });

  const palette = ['#4dd8ff', '#5fb2ff', '#8a8dff', '#b47dff', '#e06bff'];

  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
        <defs>
          <radialGradient id="globeGrad">
            <stop offset="0%" stopColor="#7fd8ff" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#4d8fff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4d8fff" stopOpacity="0" />
          </radialGradient>
          <filter id="outroGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 星球本体 */}
        <g transform={`translate(${cx} ${cy}) scale(${beat})`}>
          {/* 外层光晕 */}
          <circle r={R * 1.7} fill="url(#globeGrad)" />
          {/* 球体 */}
          <circle
            r={R * converge}
            fill="rgba(10,30,70,0.85)"
            stroke="#8fd8ff"
            strokeWidth={2}
            filter="url(#outroGlow)"
          />
          {/* 经纬线 */}
          {[0.35, 0.7, 1].map((t, i) => (
            <ellipse
              key={`lat${i}`}
              rx={R * t * converge}
              ry={R * 0.32 * converge}
              fill="none"
              stroke="#6fb8ff"
              strokeWidth={1}
              opacity={0.28 * converge}
              transform={`rotate(${spin * 20 + i * 30})`}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <ellipse
              key={`lon${i}`}
              rx={R * 0.3 * converge}
              ry={R * converge}
              fill="none"
              stroke="#6fb8ff"
              strokeWidth={1}
              opacity={0.22 * converge}
              transform={`rotate(${i * 60 + spin * 30})`}
            />
          ))}

          {/* 大陆斑点（自转） */}
          {orbitNodes.slice(0, 14).map((n, i) => {
            const ang = n.a + spin * n.speed;
            const px = Math.cos(ang) * R * 0.8 * converge;
            const py = Math.sin(ang * 1.3) * R * 0.5 * converge;
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={n.size * 2.6}
                fill="#4dd8ff"
                opacity={0.18 * converge}
              />
            );
          })}

          {/* 球面节点（汇聚而来） */}
          {orbitNodes.map((n, i) => {
            const ang = n.a + spin * n.speed;
            // 从外部汇聚到轨道
            const from = 2.6;
            const to = 1.35 + n.r / R;
            const rr = R * (from + (to - from) * converge);
            const px = Math.cos(ang) * rr;
            const py = Math.sin(ang) * rr * 0.55;
            const col = palette[Math.floor(n.hue * palette.length)];
            return (
              <g key={`o${i}`}>
                <circle cx={px} cy={py} r={n.size * 2.2} fill={col} opacity={0.25} />
                <circle cx={px} cy={py} r={n.size} fill="#ffffff" filter="url(#outroGlow)" />
                {/* 与球心连线 */}
                <line
                  x1={0}
                  y1={0}
                  x2={px}
                  y2={py}
                  stroke={col}
                  strokeWidth={0.8}
                  opacity={0.16 * converge}
                />
              </g>
            );
          })}
        </g>

        {/* 中心心跳波纹 */}
        {[0, 1, 2].map((i) => {
          const t = ((local * 0.014 + i * 0.33) % 1);
          return (
            <circle
              key={`pulse${i}`}
              cx={cx}
              cy={cy}
              r={R + t * R * 2.6}
              fill="none"
              stroke="#8fd8ff"
              strokeWidth={2.5 * (1 - t)}
              opacity={0.4 * (1 - t)}
            />
          );
        })}
      </svg>

      {/* 标语 */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: height * 0.72,
            textAlign: 'center',
            opacity: titleP,
            transform: `scale(${titleScale})`,
          }}
        >
          <div
            style={{
              fontFamily: 'Microsoft YaHei, sans-serif',
              fontSize: 92,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: 16,
              textShadow: '0 0 80px rgba(120,200,255,0.85), 0 0 30px rgba(0,0,0,0.9)',
            }}
          >
            连接，永不停歇
          </div>
          <div
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: 30,
              color: '#8fd0ff',
              letterSpacing: 12,
              marginTop: 26,
              opacity: subP,
            }}
          >
            THE NETWORK NEVER STOPS · 1969 → FUTURE
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
