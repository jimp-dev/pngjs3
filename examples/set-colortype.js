import fs from 'fs';
import PNG from '../lib';

const width = 320;
const height = 200;

let bitmapWithoutAlpha = new Buffer(width * height * 3);
let ofs = 0;
for (let i = 0; i < bitmapWithoutAlpha.length; i += 3) {
  bitmapWithoutAlpha[ofs++] = 0xff;
  bitmapWithoutAlpha[ofs++] = i % 0xff;
  bitmapWithoutAlpha[ofs++] = (i / 3) % 0xff;
}

let png = new PNG({
  width,
  height,
  bitDepth: 8,
  colorType: 2,
  inputHasAlpha: false,
});

png.data = bitmapWithoutAlpha;
png.pack().pipe(fs.createWriteStream('colortype2.png'));

png = new PNG({
  width,
  height,
  bitDepth: 8,
  colorType: 6,
  inputHasAlpha: false,
});

png.data = bitmapWithoutAlpha;
png.pack().pipe(fs.createWriteStream('colortype6.png'));
