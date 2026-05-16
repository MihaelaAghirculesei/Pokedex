import sharp from 'sharp';
import { copyFile, stat } from 'fs/promises';

const TYPE_ICONS = [
  'water',
  'grass',
  'fire',
  'normal',
  'bug',
  'poison',
  'electric',
  'ground',
  'flying',
  'psychic',
  'fairy',
  'fighting',
  'rock',
  'steel',
  'ice',
  'ghost',
  'dark',
  'dragon',
];
const APP_ICONS = ['pokemon-ball', 'icon-pokemon'];

async function resize(name, size) {
  const src = `imgs/icons/${name}.png`;
  const { size: before } = await stat(src);

  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(`imgs/icons/${name}.tmp.png`);

  // Replace in-place
  await sharp(`imgs/icons/${name}.tmp.png`).toFile(src);
  await import('fs/promises').then((fs) => fs.unlink(`imgs/icons/${name}.tmp.png`));
  await copyFile(src, `public/imgs/icons/${name}.png`);

  const { size: after } = await stat(src);
  const saved = (100 - (after / before) * 100).toFixed(0);
  console.log(
    `  ${name.padEnd(16)} ${(before / 1024).toFixed(1).padStart(6)} kB → ` +
      `${(after / 1024).toFixed(1).padStart(6)} kB  (-${saved}%)`,
  );
  return { before, after };
}

let totalBefore = 0,
  totalAfter = 0;

console.log('Type icons (→ 70×70):');
for (const name of TYPE_ICONS) {
  const { before, after } = await resize(name, 70);
  totalBefore += before;
  totalAfter += after;
}

console.log('\nApp icons (→ 160×160):');
for (const name of APP_ICONS) {
  const { before, after } = await resize(name, 160);
  totalBefore += before;
  totalAfter += after;
}

const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(0);
console.log(
  `\nTotale: ${(totalBefore / 1024).toFixed(1)} kB → ${(totalAfter / 1024).toFixed(1)} kB  (-${saved}%)`,
);
