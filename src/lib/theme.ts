/** Shared palette for the daylight stage and its typography. */
export const PAPER = '#f2f7fc';
export const INK = '#172f49';
export const MUTED = '#5d7388';
export const WORLD_ACCENT = '#087f86';

// Scene labels may carry their own pastel signal colors. Give them a readable
// ink equivalent without mutating the colors used by the Three.js materials.
export const labelInk = (color: string): string => {
  const hex = color.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return INK;
  const rgb = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  const luminance = () => rgb.reduce((sum, value, index) => sum + linear(value) * [0.2126, 0.7152, 0.0722][index], 0);
  while (luminance() > 0.14) rgb.forEach((value, index) => {rgb[index] = value * 0.94;});
  return `#${rgb.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}`;
};
