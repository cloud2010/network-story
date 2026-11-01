import {AbsoluteFill} from 'remotion';
import {ThreeStage} from './components/ThreeStage';
import {CinematicOverlay} from './components/CinematicOverlay';
import {Narration} from './components/Narration';
import {PAPER} from './lib/theme';

export const NetworkChronicle: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      <ThreeStage />
      <CinematicOverlay />
      <Narration />
    </AbsoluteFill>
  );
};
