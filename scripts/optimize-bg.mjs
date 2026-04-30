import sharp from 'sharp';
import { copyFile } from 'fs/promises';

const SRC      = 'imgs/background/Designer.jpeg';
const DEST_WEBP = 'imgs/background/Designer.webp';
const PUB_WEBP  = 'public/imgs/background/Designer.webp';
const ORIG_SIZE = 221514; // bytes of the original JPEG

const info = await sharp(SRC)
  .webp({ quality: 65 })
  .toFile(DEST_WEBP);

await copyFile(DEST_WEBP, PUB_WEBP);

const kb = (b) => (b / 1024).toFixed(1) + ' kB';
const saved = (100 - (info.size / ORIG_SIZE) * 100).toFixed(0);
console.log(`Designer.webp: ${kb(info.size)}  (da ${kb(ORIG_SIZE)} JPEG, -${saved}%)`);
