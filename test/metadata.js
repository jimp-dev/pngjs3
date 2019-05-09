#!/usr/bin/env babel-node
import fs from 'fs';
import PNG from '../lib';
import test from 'tape';

test('Check same image saved in different modes generate the same buffers', (t) => {
  t.timeoutAfter(1000 * 60 * 5);

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const grayPNG = new PNG();
  fs.createReadStream(grayscaleGradient)
    .pipe(grayPNG)
    .on('error', (error) => {
      t.fail(`Failed to convert grayscale file: ${error.message}`);
      t.end();
    })
    .on('parsed', () => {
      t.equal(grayPNG.width, 50);
      t.equal(grayPNG.height, 100);
      t.equal(grayPNG.color, false);
      t.end();
    });
});
