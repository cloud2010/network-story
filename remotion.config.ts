import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Hardware rendering for the Three.js stage; override with --gl=swangle if needed.
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(1);
