import {Composition} from 'remotion';
import {NetworkChronicle} from './NetworkChronicle';
import {FPS, TOTAL_FRAMES, WIDTH, HEIGHT} from './data/milestones';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NetworkChronicle"
      component={NetworkChronicle}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
