import {AbsoluteFill} from 'remotion';
import {ThreeStage} from './components/ThreeStage';
import {CinematicOverlay} from './components/CinematicOverlay';

export const NetworkChronicle: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#070c10'}}>
      <ThreeStage />
      <CinematicOverlay />
    </AbsoluteFill>
  );
};
