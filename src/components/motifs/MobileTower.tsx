import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 2007：移动互联网——手机从桌面机演化，信号塔与移动终端双向通信 */
export const MobileTower: React.FC<{progress: number; frame: number}> = ({progress, frame}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('移动时代');
  const cy = height * 0.44;

  const towerX = width * 0.3;
  const phoneX = width * 0.68;

  const towerGrow = Math.max(1, mapRange(progress, 0, 0.3, 0, 1));
  const phoneAppear = Math.max(1, mapRange(progress, 0.28, 0.45, 0, 1));

  // 手机内的 app 图标网格
  const apps = 12;

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowH" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 信号塔 */}
      <g opacity={towerGrow}>
        {/* 塔身 */}
        <path
          d={`M${towerX - 40} ${cy + 150} L${towerX - 8} ${cy - 90} L${towerX + 8} ${cy - 90} L${towerX + 40} ${cy + 150}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          filter="url(#mtGlowH)"
        />
        {/* 横梁 */}
        {[0.2, 0.45, 0.7].map((t) => {
          const y = cy + 150 - (240 * t);
          const halfW = 40 - 32 * t;
          return <line key={t} x1={towerX - halfW} y1={y} x2={towerX + halfW} y2={y} stroke={color} strokeWidth={1.6} opacity={0.55} />;
        })}
        {/* 天线 */}
        <line x1={towerX} y1={cy - 90} x2={towerX} y2={cy - 150} stroke={color} strokeWidth={3} />
        <circle cx={towerX} cy={cy - 156} r={6} fill={color} filter="url(#mtGlowH)">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        {/* 覆盖波纹 */}
        {[0, 1, 2].map((i) => {
          const t = ((frame * 0.014 + i * 0.33) % 1);
          return (
            <path
              key={i}
              d={`M${towerX - 30 - t * 130} ${cy - 100 - t * 90} Q${towerX} ${cy - 150 - t * 110} ${towerX + 30 + t * 130} ${cy - 100 - t * 90}`}
              fill="none"
              stroke={color}
              strokeWidth={2.5 * (1 - t)}
              opacity={0.5 * (1 - t)}
            />
          );
        })}
      </g>

      {/* 通信链路：塔 ↔ 手机 */}
      {progress > 0.5 && (
        <>
          {[0, 1].map((dir) => {
            const t = ((frame * 0.02 + dir * 0.5) % 1);
            const px = dir === 0 ? towerX + (phoneX - towerX) * t : phoneX - (phoneX - towerX) * t;
            const py = cy - 60 - Math.sin(t * Math.PI) * 90;
            return (
              <g key={dir}>
                <rect x={px - 13} y={py - 9} width={26} height={18} rx={3} fill={color} filter="url(#mtGlowH)" />
                <circle cx={px} cy={py} r={14} fill={color} opacity={0.25} />
              </g>
            );
          })}
        </>
      )}

      {/* 智能手机 */}
      <g opacity={phoneAppear} transform={`translate(${phoneX} ${cy - 20})`}>
        {/* 机身 */}
        <rect
          x={-72}
          y={-120}
          width={144}
          height={270}
          rx={22}
          fill="rgba(8,20,42,0.96)"
          stroke={color}
          strokeWidth={2.5}
          filter="url(#mtGlowH)"
        />
        {/* 屏幕 */}
        <rect x={-60} y={-104} width={120} height={216} rx={10} fill="rgba(20,45,85,0.6)" />
        {/* 状态栏 */}
        <rect x={-54} y={-98} width={108} height={7} rx={3} fill={color} opacity={0.5} />
        {/* App 图标网格 */}
        {Array.from({length: apps}).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const ap = mapRange(progress, 0.5 + i * 0.03, 0.62 + i * 0.03, 0, 1);
          return (
            <rect
              key={i}
              x={-52 + col * 28}
              y={-80 + row * 40}
              width={22}
              height={22}
              rx={6}
              fill={color}
              opacity={ap * (0.35 + 0.3 * Math.sin(frame / 14 + i))}
              stroke={color}
              strokeWidth={0.8}
            />
          );
        })}
        {/* Home 键 */}
        <circle cx={0} cy={130} r={13} fill="none" stroke={color} strokeWidth={2} opacity={0.8} />
        {/* 听筒 */}
        <line x1={-22} y1={-114} x2={22} y2={-114} stroke={color} strokeWidth={3} opacity={0.6} />
      </g>
    </svg>
  );
};
