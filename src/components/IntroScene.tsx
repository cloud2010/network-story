import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {INTRO_DURATION, FPS} from '../data/milestones';
import {localProgress, mapRange, mulberry} from '../lib/fx';

/** 0-8s：开场——两台终端，消息 "LO" 在链路上传输，标题随冲击波揭示 */
export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  if (frame >= INTRO_DURATION) return null;

  const color = '#4dd8ff';
  const cy = height * 0.44;

  // —— 镜头推进 ——
  const dolly = 1.0 + localProgress(frame, 0, INTRO_DURATION) * 0.1;

  // —— "LO" 传输时间线 ——
  const sendAt = 1.4 * FPS; // 1.4s 开始发送
  const arriveAt = 2.6 * FPS; // 2.6s 到达
  const sendP = localProgress(frame, sendAt, arriveAt - sendAt);
  const arrived = frame >= arriveAt;

  // 链路绘制
  const linkGrow = localProgress(frame, 0.3 * FPS, 1.0 * FPS);

  // 冲击波（到达瞬间）
  const shock = localProgress(frame, arriveAt, 0.9 * FPS);

  // "LO" 字符显示
  const loOpacity = arrived ? localProgress(frame, arriveAt, 0.25 * FPS) : 0;
  const loScale = arrived ? 1 + (1 - localProgress(frame, arriveAt, 0.5 * FPS)) * 0.5 : 0.8;

  // 标题入场
  const titleP = localProgress(frame, 3.4 * FPS, 1.4 * FPS);
  const titleY = interpolate(titleP, [0, 1], [70, 0]);

  // 副标题
  const subP = localProgress(frame, 4.4 * FPS, 1.0 * FPS);

  // 底部标语
  const tagP = localProgress(frame, 5.2 * FPS, 1.0 * FPS);

  // 结尾淡出
  const out = 1 - localProgress(frame, INTRO_DURATION - 0.8 * FPS, 0.8 * FPS);

  // 传输中的数据包抖动
  const jitter = (mulberry(Math.floor(frame * 2.5))() - 0.5) * 6;

  const leftX = width * 0.22;
  const rightX = width * 0.78;

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${dolly})`, transformOrigin: 'center center'}}>
        <svg width={width} height={height} style={{position: 'absolute', top: 0, left: 0}}>
          <defs>
            <filter id="introGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 通信链路 */}
          <line
            x1={leftX + 90}
            y1={cy}
            x2={leftX + 90 + (rightX - 90 - (leftX + 90)) * linkGrow}
            y2={cy}
            stroke={color}
            strokeWidth={3}
            opacity={0.7}
            filter="url(#introGlow)"
          />

          {/* 链路脉冲（发送前） */}
          {!arrived && linkGrow >= 1 && (
            <circle
              cx={leftX + 90 + ((frame * 5) % (rightX - leftX - 180))}
              cy={cy}
              r={4}
              fill={color}
              opacity={0.6}
            />
          )}

          {/* 数据包（发送中） */}
          {!arrived && sendP > 0 && (
            <g transform={`translate(${leftX + 90 + (rightX - 90 - (leftX + 90)) * sendP} ${cy + jitter})`}>
              <rect x={-16} y={-11} width={32} height={22} rx={4} fill={color} filter="url(#introGlow)" />
              <text x={0} y={5} textAnchor="middle" fill="#04101f" fontSize={12} fontFamily="Consolas, monospace" fontWeight={700}>
                LO
              </text>
              <circle cx={0} cy={0} r={26} fill={color} opacity={0.18} />
            </g>
          )}

          {/* 到达冲击波 */}
          {shock > 0 && shock < 1 && (
            <>
              <circle cx={rightX} cy={cy} r={20 + shock * 260} fill="none" stroke="#ffffff" strokeWidth={4 * (1 - shock)} opacity={1 - shock} />
              <circle cx={rightX} cy={cy} r={20 + shock * 400} fill="none" stroke={color} strokeWidth={2 * (1 - shock)} opacity={0.7 * (1 - shock)} />
            </>
          )}

          {/* 终端 A */}
          <g>
            <rect
              x={leftX - 90}
              y={cy - 70}
              width={180}
              height={140}
              rx={8}
              fill="rgba(8,20,42,0.95)"
              stroke={color}
              strokeWidth={2.5}
              filter="url(#introGlow)"
            />
            <rect x={leftX - 74} y={cy - 54} width={148} height={90} rx={4} fill={color} opacity={0.1} />
            {/* 扫描线 */}
            <line
              x1={leftX - 74}
              y1={cy - 54 + ((frame * 3) % 90)}
              x2={leftX + 74}
              y2={cy - 54 + ((frame * 3) % 90)}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.45}
            />
            <text x={leftX} y={cy + 34} textAnchor="middle" fill={color} fontSize={20} fontFamily="Consolas, monospace" fontWeight={700}>
              UCLA
            </text>
            <text x={leftX} y={cy + 54} textAnchor="middle" fill="rgba(160,200,240,0.8)" fontSize={14} fontFamily="Consolas, monospace">
              1969.10.29 22:30
            </text>
          </g>

          {/* 终端 B */}
          <g>
            <rect
              x={rightX - 90}
              y={cy - 70}
              width={180}
              height={140}
              rx={8}
              fill="rgba(8,20,42,0.95)"
              stroke={arrived ? '#ffffff' : color}
              strokeWidth={arrived ? 3 : 2.5}
              filter="url(#introGlow)"
            />
            <rect x={rightX - 74} y={cy - 54} width={148} height={90} rx={4} fill={color} opacity={0.12} />
            {/* 收到的消息 */}
            <text
              x={rightX}
              y={cy + 2}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={54}
              fontFamily="Consolas, monospace"
              fontWeight={700}
              opacity={loOpacity}
              transform={`translate(0 0) scale(${loScale})`}
              style={{transformOrigin: `${rightX}px ${cy}px`}}
            >
              {loOpacity > 0 ? 'LO' : ''}
            </text>
            <text x={rightX} y={cy + 34} textAnchor="middle" fill={color} fontSize={20} fontFamily="Consolas, monospace" fontWeight={700}>
              SRI
            </text>
          </g>
        </svg>

        {/* 主标题 */}
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.14,
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: titleP,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: 'Microsoft YaHei, sans-serif',
              fontSize: 100,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: 14,
              textShadow: `0 0 80px ${color}99, 0 0 30px rgba(0,0,0,0.9)`,
            }}
          >
            计算机网络发展编年史
          </div>
          <div
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: 30,
              color,
              letterSpacing: 12,
              marginTop: 22,
              opacity: subP,
            }}
          >
            1969 — 2019 · SIXTY SECONDS
          </div>
        </div>

        {/* 底部标语 */}
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.05,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'Microsoft YaHei, sans-serif',
            fontSize: 24,
            color: 'rgba(130,175,225,0.85)',
            letterSpacing: 8,
            opacity: tagP,
          }}
        >
          从 4 台主机，到万物互联
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
