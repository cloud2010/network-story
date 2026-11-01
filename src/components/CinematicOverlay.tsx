import React from 'react';
import {INK, MUTED, WORLD_ACCENT} from '../lib/theme';
import {gsap} from 'gsap';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  INTRO_DURATION,
  MILESTONE_DURATION,
  MILESTONES,
  OUTRO_DURATION,
  TOTAL_FRAMES,
  type Milestone,
} from '../data/milestones';

const MONO = '"Cascadia Code", "Consolas", monospace';
const SANS = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
const expoOut = gsap.parseEase('expo.out');
const powerOut = gsap.parseEase('power3.out');
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const reveal = (frame: number, start = 0, length = 24) =>
  powerOut(clamp((frame - start) / length));

type RevealProps = {
  frame: number;
  start?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const Reveal: React.FC<RevealProps> = ({frame, start = 0, children, style}) => {
  const amount = reveal(frame, start);
  return (
    <div style={{overflow: 'hidden', ...style}}>
      <div
        style={{
          opacity: amount,
          transform: `translateY(${(1 - amount) * 40}px)`,
          clipPath: `inset(0 ${(1 - amount) * 100}% 0 0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Header: React.FC<{frame: number; accent: string}> = ({frame, accent}) => {
  const enter = reveal(frame, 4, 28);
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 59,
        right: 96,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: enter,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <span style={{width: 7, height: 7, background: accent, display: 'block'}} />
        <span style={{fontFamily: MONO, fontSize: 16, letterSpacing: 3.2, color: MUTED}}>
          NETWORK / A VISUAL HISTORY
        </span>
      </div>
      <div style={{fontSize: 17, letterSpacing: 3, color: MUTED}}>
        计算机网络发展编年史
      </div>
    </div>
  );
};

const Timeline: React.FC<{
  index: number;
  progress: number;
  accent: string;
  opacity: number;
}> = ({index, progress, accent, opacity}) => {
  const extent = clamp((index + progress) / (MILESTONES.length - 1));
  return (
    <div style={{position: 'absolute', top: 969, left: 96, width: 1728, opacity}}>
      <div style={{height: 1, width: '100%', background: 'rgba(65,105,145,.22)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 1,
          width: `${extent * 100}%`,
          background: `linear-gradient(90deg, ${accent}44, ${accent})`,
        }}
      />
      {MILESTONES.map((milestone, markerIndex) => {
        const selected = markerIndex === index;
        const visited = markerIndex < index;
        const x = (markerIndex / (MILESTONES.length - 1)) * 100;
        return (
          <div key={milestone.year} style={{position: 'absolute', left: `${x}%`, top: 0}}>
            <div
              style={{
                position: 'absolute',
                top: selected ? -7 : -3,
                left: selected ? -2 : -1,
                width: selected ? 4 : 2,
                height: selected ? 15 : 7,
                background: selected ? accent : visited ? '#68849d' : '#a6b9ca',
                boxShadow: selected ? `0 0 15px ${accent}66` : undefined,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 23,
                transform: 'translateX(-50%)',
                fontFamily: MONO,
                fontSize: selected ? 20 : 17,
                fontWeight: selected ? 700 : 400,
                letterSpacing: 1,
                color: selected ? accent : visited ? '#526e88' : '#73889c',
              }}
            >
              {milestone.year}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 76,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: 2,
          color: MUTED,
        }}
      >
        50 YEARS OF CONNECTION
      </div>
      <div style={{position: 'absolute', right: 0, top: 73, fontSize: 14, color: MUTED}}>
        {String(index + 1).padStart(2, '0')}
        <span style={{color: '#73889c', marginLeft: 8}}> / 10</span>
      </div>
    </div>
  );
};

const Chapter: React.FC<{frame: number; index: number; milestone: Milestone}> = ({
  frame,
  index,
  milestone,
}) => {
  const {accent} = milestone;
  const progress = clamp(frame / MILESTONE_DURATION);
  const entrance = reveal(frame, 0, 18);
  const exit = 1 - reveal(frame, MILESTONE_DURATION - 14, 14);
  const visible = entrance * exit;
  const activeStep = milestone.motif === 'handshake'
    ? Math.max(0, Math.min(2, Math.floor((progress - 0.06) / 0.2)))
    : milestone.motif === 'ipv6'
      ? progress < 0.22 ? 0 : progress < 0.67 ? 1 : 2
      : Math.min(2, Math.floor(clamp((frame - 25) / (MILESTONE_DURATION - 36)) * 3));
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 186,
          width: 755,
          opacity: visible,
          transform: `translateX(${(1 - entrance) * 28 - (1 - exit) * 18}px)`,
        }}
      >
        <Reveal frame={frame} start={0} style={{height: 31}}>
          <div style={{display: 'flex', gap: 17, alignItems: 'center'}}>
            <span style={{fontFamily: MONO, color: accent, letterSpacing: 2, fontSize: 16}}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span style={{width: 32, height: 1, background: accent, opacity: 0.7}} />
            <span style={{fontSize: 18, letterSpacing: 3, color: MUTED}}>{milestone.era}</span>
          </div>
        </Reveal>
        <Reveal frame={frame} start={1} style={{marginTop: 12}}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 126,
              lineHeight: 1.08,
              fontWeight: 500,
              letterSpacing: -8,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {milestone.year}
            <span style={{fontSize: 22, letterSpacing: 0, marginLeft: 19, color: accent}}>年</span>
          </div>
        </Reveal>
        <Reveal frame={frame} start={6} style={{marginTop: 15}}>
          <div style={{fontSize: 61, fontWeight: 700, lineHeight: 1.26, letterSpacing: -1.8}}>
            {milestone.title}
          </div>
        </Reveal>
        <Reveal frame={frame} start={12} style={{marginTop: 23}}>
          <div style={{fontFamily: MONO, fontSize: 15, color: accent, letterSpacing: 2.8}}>
            {milestone.kicker}
          </div>
        </Reveal>
        <Reveal frame={frame} start={15} style={{marginTop: 29, width: 695}}>
          <div style={{fontSize: 28, lineHeight: 1.65, color: '#405b75', fontWeight: 400, whiteSpace: 'pre-line'}}>
            {milestone.mechanism}
          </div>
        </Reveal>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 690,
          left: 96,
          width: 710,
          opacity: reveal(frame, 23, 22) * exit,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: MUTED, marginBottom: 20}}>
          HOW IT WORKS
        </div>
        <div style={{display: 'flex', gap: 28}}>
          {milestone.steps.map((step, stepIndex) => {
            const current = stepIndex === activeStep;
            const completed = stepIndex < activeStep;
            return (
              <div key={`${index}-${stepIndex}`} style={{flex: 1, position: 'relative'}}>
                <div
                  style={{
                    height: 2,
                    width: '100%',
                    background: current ? accent : completed ? `${accent}55` : '#c6d5e3',
                    marginBottom: 18,
                  }}
                />
                <div style={{fontFamily: MONO, fontSize: 12, color: current ? accent : MUTED, marginBottom: 9}}>
                  0{stepIndex + 1}
                </div>
                <div style={{fontSize: 21, color: current ? INK : MUTED, lineHeight: 1.4}}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 96,
          top: 745,
          textAlign: 'right',
          opacity: reveal(frame, 22, 28) * exit,
          transform: `translateY(${(1 - reveal(frame, 22, 28)) * 20}px)`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 69, lineHeight: 1.1, color: accent, letterSpacing: -3}}>
          {milestone.metric}
        </div>
        <div style={{fontSize: 18, lineHeight: 1.5, marginTop: 10, color: MUTED, letterSpacing: 1}}>
          {milestone.metricLabel}
        </div>
      </div>
      <Timeline index={index} progress={progress} accent={accent} opacity={reveal(frame, 4, 18)} />
    </>
  );
};

const Opening: React.FC<{frame: number}> = ({frame}) => {
  const exit = 1 - reveal(frame, INTRO_DURATION - 18, 18);
  const lineAmount = expoOut(clamp((frame - 17) / 56));
  return (
    <div style={{opacity: exit}}>
      <Reveal frame={frame} start={12} style={{position: 'absolute', top: 219, left: 96}}>
        <div style={{fontFamily: MONO, color: WORLD_ACCENT, fontSize: 18, letterSpacing: 5}}>1969 — 2019</div>
      </Reveal>
      <div style={{position: 'absolute', top: 292, left: 90, width: 880}}>
        <Reveal frame={frame} start={17}>
          <div style={{fontSize: 91, fontWeight: 700, lineHeight: 1.25, letterSpacing: -4}}>一次连接，</div>
        </Reveal>
        <Reveal frame={frame} start={28} style={{marginTop: 7}}>
          <div style={{fontSize: 91, fontWeight: 700, lineHeight: 1.25, letterSpacing: -4}}>改变整个世界。</div>
        </Reveal>
      </div>
      <div style={{position: 'absolute', top: 584, left: 96, height: 2, width: 89 * lineAmount, background: WORLD_ACCENT}} />
      <Reveal frame={frame} start={44} style={{position: 'absolute', top: 620, left: 96, width: 665}}>
        <div style={{fontSize: 26, color: MUTED, lineHeight: 1.7, letterSpacing: 1}}>
          从第一条消息，到连接万物。<br />
          看见 10 次技术跃迁背后的工作原理。
        </div>
      </Reveal>
      <div style={{position: 'absolute', left: 96, bottom: 57, opacity: reveal(frame, 61), display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{height: 1, width: 42, background: MUTED}} />
        <span style={{fontSize: 16, letterSpacing: 3, color: MUTED}}>计算机网络发展编年史</span>
      </div>
      <div style={{position: 'absolute', right: 96, bottom: 57, fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: MUTED, opacity: reveal(frame, 61)}}>
        10 MILESTONES / 50 YEARS
      </div>
    </div>
  );
};

const Closing: React.FC<{frame: number}> = ({frame}) => {
  const fadeOut = 1 - reveal(frame, OUTRO_DURATION - 15, 15);
  return (
    <div style={{opacity: fadeOut}}>
      <Reveal frame={frame} start={7} style={{position: 'absolute', left: 96, top: 221}}>
        <div style={{fontFamily: MONO, fontSize: 17, letterSpacing: 4, color: WORLD_ACCENT}}>THE NEXT CONNECTION</div>
      </Reveal>
      <div style={{position: 'absolute', left: 90, top: 295}}>
        <Reveal frame={frame} start={11}>
          <div style={{fontSize: 92, fontWeight: 700, lineHeight: 1.28, letterSpacing: -4}}>从四个节点</div>
        </Reveal>
        <Reveal frame={frame} start={22} style={{marginTop: 5}}>
          <div style={{fontSize: 92, fontWeight: 700, lineHeight: 1.28, letterSpacing: -4}}>到万物互联。</div>
        </Reveal>
      </div>
      <Reveal frame={frame} start={39} style={{position: 'absolute', left: 96, top: 624, width: 710}}>
        <div style={{fontSize: 26, color: MUTED, lineHeight: 1.8}}>
          协议让连接成为可能，<br />
          每一次突破，都让世界靠得更近。
        </div>
      </Reveal>
      <Reveal frame={frame} start={58} style={{position: 'absolute', left: 96, bottom: 57}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{height: 1, width: 53, background: WORLD_ACCENT}} />
          <span style={{fontSize: 22, letterSpacing: 3, color: INK}}>下一次连接，由我们创造。</span>
        </div>
      </Reveal>
      <div style={{position: 'absolute', right: 96, bottom: 57, fontFamily: MONO, fontSize: 14, letterSpacing: 2, color: MUTED, opacity: reveal(frame, 58)}}>
        1969 → TOMORROW
      </div>
    </div>
  );
};

/** Frame-derived DOM animation keeps Studio scrubbing and rendered frames identical. */
export const CinematicOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const mainFrame = frame - INTRO_DURATION;
  const outroStart = TOTAL_FRAMES - OUTRO_DURATION;
  const isOpening = frame < INTRO_DURATION;
  const isClosing = frame >= outroStart;
  const index = Math.max(0, Math.min(MILESTONES.length - 1, Math.floor(mainFrame / MILESTONE_DURATION)));
  const localFrame = mainFrame - index * MILESTONE_DURATION;
  const milestone = MILESTONES[index];
  const accent = isOpening || isClosing ? WORLD_ACCENT : milestone.accent;
  const scale = Math.min(width / 1920, height / 1080);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: 1080,
          left: (width - 1920 * scale) / 2,
          top: (height - 1080 * scale) / 2,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: SANS,
          color: INK,
        }}
      >
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(248,251,255,.96) 0%, rgba(248,251,255,.78) 29%, rgba(248,251,255,.12) 48%, transparent 60%)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 35%, rgba(255,255,255,.12), transparent 66%)'}} />
        <Header frame={frame} accent={accent} />
        {isOpening ? <Opening frame={frame} /> : isClosing ? <Closing frame={frame - outroStart} /> : <Chapter frame={localFrame} index={index} milestone={milestone} />}
      </div>
    </AbsoluteFill>
  );
};
