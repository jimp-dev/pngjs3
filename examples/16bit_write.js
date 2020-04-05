#!/usr/bin/env node
import fs from 'fs';
import PNG from '../lib';

var width = 32;
var height = 64;

/// RGBA input (color type 6)
var buffer = Buffer.alloc(2 * width * height * 4);
var bitmap = new Uint16Array(buffer.buffer);
for (let i = 0; i < height; i++) {
  for (let j = 0; j < width; j++) {
    bitmap[i * 4 * width + 4 * j] = (i * 65535) / height;
    bitmap[i * 4 * width + 4 * j + 1] = (j * 65535) / width;
    bitmap[i * 4 * width + 4 * j + 2] = ((height - i) * 65535) / height;
    bitmap[i * 4 * width + 4 * j + 3] = 65535;
  }
}

var png = new PNG({
  width,
  height,
  bitDepth: 16,
  colorType: 6,
  inputColorType: 6,
  inputHasAlpha: true,
});

png.data = buffer;
png.pack().pipe(fs.createWriteStream('colortype6.png'));

//////// Grayscale 16 bits///////

buffer = Buffer.alloc(2 * width * height);
bitmap = new Uint16Array(buffer.buffer);
for (let i = 0; i < height; i++) {
  for (let j = 0; j < width; j++) {
    bitmap[i * width + j] = (i * 65535) / height;
  }
}

png = new PNG({
  width,
  height,
  bitDepth: 16,
  colorType: 0,
  inputColorType: 0,
  inputHasAlpha: false,
});

png.data = buffer;
png.pack().pipe(fs.createWriteStream('colortype0.png'));
