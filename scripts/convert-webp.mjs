import sharp from 'sharp';
import { stat } from 'fs/promises';

const TYPE_ICONS = [
  'water','grass','fire','normal','bug','poison','electric','ground',
  'flying','psychic','fairy','fighting','rock','steel','ice','ghost',
  'dark','dragon',
];
const APP_ICONS = ['pokemon-ball', 'icon-pokemon'];

async function convertToWebP(name) {
  const src = `public/imgs/icons/${name}.png`;
  const dest = `public/imgs/icons/${name}.webp`;
  const { size: before } = await stat(src);

  await sharp(src).webp({ quality: 85 }).toFile(dest);

  const { size: after } = await stat(dest);
  const saved = (100 - (after / before) * 100).toFixed(0);
  console.log(
    `  ${name.padEnd(16)} ${(before/1024).toFixed(1).padStart(6)} kB → ` +
    `${(after/1024).toFixed(1).padStart(6)} kB  (-${saved}%)`
  );
  return { before, after };
}

let totalBefore = 0, totalAfter = 0;

console.log('Type icons (PNG → WebP):');
for (const name of TYPE_ICONS) {
  const { before, after } = await convertToWebP(name);
  totalBefore += before; totalAfter += after;
}

console.log('\nApp icons (PNG → WebP):');
for (const name of APP_ICONS) {
  const { before, after } = await convertToWebP(name);
  totalBefore += before; totalAfter += after;
}

const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(0);
console.log(
  `\nTotale: ${(totalBefore/1024).toFixed(1)} kB → ${(totalAfter/1024).toFixed(1)} kB  (-${saved}%)`
);
