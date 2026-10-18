import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

// One bundle and browser for a visual inspection of all twelve scenes.
const shots = [
  ['opening', 105], ['arpanet', 240], ['ethernet', 390], ['tcp', 540],
  ['dns', 690], ['web', 840], ['mosaic', 990], ['wifi', 1140],
  ['mobile', 1290], ['ipv6', 1440], ['5g', 1590], ['closing', 1740],
];
await mkdir(resolve('out/review'), {recursive: true});
const serveUrl = await bundle({entryPoint: resolve('src/index.ts'), outDir: resolve('out/bundle')});
const chromiumOptions = {gl: process.env.REMOTION_GL || 'angle'};
const browser = await openBrowser('chrome', {chromiumOptions});
try {
  const composition = await selectComposition({serveUrl, id: 'NetworkChronicle', puppeteerInstance: browser, chromiumOptions});
  for (const [name, frame] of shots) {
    await renderStill({serveUrl, composition, puppeteerInstance: browser, chromiumOptions, frame, output: resolve(`out/review/${name}.png`), imageFormat: 'png', overwrite: true});
    console.log(`Rendered ${name} @ ${frame}`);
  }
} finally {
  await browser.close({silent: true});
}
