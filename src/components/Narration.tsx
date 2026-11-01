import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timing from '../data/narration-timing.json';
import {INK, WORLD_ACCENT} from '../lib/theme';

/** Audio and captions share Edge's sentence timestamps, including chapter gaps. */
export const Narration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  if (fps !== timing.fps || durationInFrames !== timing.totalFrames) {
    throw new Error('Narration timing differs from the composition. Regenerate the narration after changing the film duration.');
  }
  const now = frame / fps * 1000;
  const clip = timing.clips.find(item => frame >= item.from && frame < item.from + item.durationInFrames);
  const caption = clip?.captions.find(item => now >= item.startMs && now < item.endMs);
  const scale = Math.min(width / 1920, height / 1080);
  return (
    <>
      {timing.clips.map(item => (
        <Sequence key={item.id} from={item.from} durationInFrames={item.durationInFrames} layout="none" name={`旁白 · ${item.id}`}>
          <Audio src={staticFile(item.src)} />
        </Sequence>
      ))}
      {caption && (
        <AbsoluteFill style={{pointerEvents: 'none', alignItems: 'center'}}>
          <div style={{
            position: 'absolute', top: (height - 1080 * scale) / 2 + 882 * scale,
            transform: `scale(${scale})`, transformOrigin: 'top center',
            display: 'flex', alignItems: 'center', gap: 18, padding: '14px 29px',
            maxWidth: 1320, minHeight: 64, boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(63,105,145,0.18)',
            borderRadius: 12, boxShadow: '0 5px 22px rgba(43,83,117,0.09)',
            fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
            fontSize: 32, lineHeight: 1.25, fontWeight: 600, letterSpacing: 1, color: INK,
          }}>
            <span style={{width: 4, height: 25, borderRadius: 2, background: WORLD_ACCENT, flexShrink: 0}} />
            <span>{caption.text}</span>
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};
