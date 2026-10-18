import {useVideoConfig} from 'remotion';
import {eraColor} from '../../data/milestones';
import {mapRange} from '../../lib/fx';

/** 1993：Mosaic 浏览器——窗口从中心放大，页面滚动渲染，图片逐个加载 */
export const BrowserWindow: React.FC<{progress: number; frame: number}> = ({
  progress,
  frame,
}) => {
  const {width, height} = useVideoConfig();
  const color = eraColor('万维网');
  const w = 560;
  const h = 380;
  const cx = width / 2;
  const cy = height * 0.42;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const open = mapRange(progress, 0, 0.25, 0.4, 1);
  // 滚动在中段播放一次后停在底部
  const scroll = progress < 0.35 ? 0 : progress > 0.85 ? 130 : mapRange(progress, 0.35, 0.85, 0, 130);
  const loaded = mapRange(progress, 0.3, 0.75, 0, 1);

  const imgSlots = [
    {ix: x + 26, iy: y + 66, iw: 150, ih: 100},
    {ix: x + 196, iy: y + 66, iw: 150, ih: 100},
    {ix: x + 366, iy: y + 66, iw: 168, ih: 100},
  ];

  return (
    <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <filter id="mtGlowF" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="pageClip">
          <rect x={x} y={y} width={w} height={h} rx={8} />
        </clipPath>
        <linearGradient id="imgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <g transform={`translate(${cx} ${cy}) scale(${open}) translate(${-cx} ${-cy})`} filter="url(#mtGlowF)">
        {/* 窗口 */}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          fill="rgba(8,20,42,0.96)"
          stroke={color}
          strokeWidth={2.2}
        />
        {/* 标题栏 */}
        <rect x={x} y={y} width={w} height={30} rx={8} fill={color} opacity={0.22} />
        <line x1={x} y1={y + 30} x2={x + w} y2={y + 30} stroke={color} strokeWidth={1} opacity={0.5} />
        {/* 三色按钮 */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + 18 + i * 20} cy={y + 15} r={5} fill={color} opacity={0.85} />
        ))}
        {/* 地址栏 */}
        <rect x={x + 84} y={y + 8} width={w - 110} height={15} rx={7} fill="rgba(0,0,0,0.45)" />
        <text
          x={x + 94}
          y={y + 19}
          fill={color}
          fontSize={10}
          fontFamily="Consolas, monospace"
        >
          http://www.example.com
        </text>

        {/* 页面内容（滚动） */}
        <g clipPath="url(#pageClip)">
          <g transform={`translate(0 ${-scroll})`}>
            {/* 页头 */}
            <rect x={x + 26} y={y + 46} width={220} height={12} rx={3} fill={color} opacity={0.8} />
            {/* 图片槽 */}
            {imgSlots.map((s, i) => {
              const lp = mapRange(loaded, i * 0.25, i * 0.25 + 0.3, 0, 1);
              return (
                <g key={i} opacity={lp}>
                  <rect
                    x={s.ix}
                    y={s.iy}
                    width={s.iw}
                    height={s.ih}
                    rx={3}
                    fill="url(#imgGrad)"
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* 加载进度环 */}
                  {lp < 1 && (
                    <circle
                      cx={s.ix + s.iw / 2}
                      cy={s.iy + s.ih / 2}
                      r={12}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeDasharray={lp * 70}
                    />
                  )}
                  {/* 图标 */}
                  <path
                    d={`M${s.ix + s.iw / 2 - 8} ${s.iy + s.ih / 2 + 6} L${s.ix + s.iw / 2} ${s.iy + s.ih / 2 - 8} L${s.ix + s.iw / 2 + 8} ${s.iy + s.ih / 2 + 6} Z`}
                    fill={color}
                    opacity={0.6}
                  />
                </g>
              );
            })}
            {/* 文本行 */}
            {Array.from({length: 8}).map((_, r) => (
              <line
                key={r}
                x1={x + 26}
                y1={y + 186 + r * 18}
                x2={x + w - 26 - (r % 3 === 2 ? 80 : 0)}
                y2={y + 186 + r * 18}
                stroke={color}
                strokeWidth={4}
                opacity={0.35}
              />
            ))}
          </g>
        </g>

        {/* 滚动条 */}
        <rect x={x + w - 10} y={y + 34} width={5} height={h - 44} rx={2} fill="rgba(255,255,255,0.12)" />
        <rect
          x={x + w - 10}
          y={y + 34 + (h - 44) * (scroll / 150)}
          width={5}
          height={40}
          rx={2}
          fill={color}
        />

        {/* 加载完成闪光 */}
        {progress > 0.85 && (
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={8}
            fill="#ffffff"
            opacity={mapRange(progress, 0.85, 0.92, 0.18, 0)}
          />
        )}
      </g>

      {/* 光标 */}
      {progress > 0.2 && (
        <g
          transform={`translate(${x + 300 + Math.sin(frame / 25) * 40} ${y + 200 + Math.cos(frame / 30) * 30})`}
        >
          <path d="M0 0 L0 16 L4 12 L7 19 L10 17 L7 11 L13 11 Z" fill="#ffffff" stroke="#000" strokeWidth={1} />
        </g>
      )}
    </svg>
  );
};
