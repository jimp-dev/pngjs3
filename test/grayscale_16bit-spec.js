#!/usr/bin/env babel-node
import fs from 'fs';
import test from 'tape';
import PNG from '../lib/png';

test('read grayscale 16bit and check output', function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  const png = new PNG({ skipRescale: true });
  try {
    png.grayscaleData();
    t.fail('Invalid grayscale conversion');
  }
  catch (e) {
    t.pass(`Correct error triggerign: ${e.message}`);
  }
  const file = '/imgs/grayscale_16bit.png';
  fs.createReadStream(__dirname + file)
    .pipe(png)
    .on('error', (error) => {
      t.fail('Async: Unexpected error parsing..' + file + '\n' + error.message + '\n' + error.stack);
      t.pass('completed');
      t.end();
    })
    .on('metadata', ({
      depth,
      color,
      colorType,
    }) => {
      if (depth !== 16) {
        t.fail(`Invalid depth, expected 16 but got ${depth}`);
      }

      if (color !== false) {
        t.fail(`Invalid color, expected false but got ${color}`);
      }

      if (colorType !== 0) {
        t.fail(`Invalid colorType, expected 0 but got ${colorType}`);
      }
      t.pass('Correct metadata');
    })
    .on('parsed', () => {
      const { data, width, height, depth, color } = png;
      const maxValue = data.reduce((p, c) => c > p ? c : p, -1);
      if (maxValue !== Math.pow(2, 16) - 1) {
        t.fail(`The ${file} should have the maximium possible grayscale for a 16-bit, max value is ${maxValue}`);
      }

      if (width !== 40 || height !== 40) {
        t.fail(`Incorrect dimensions, ${width} x ${height} !== (expexted) 40 x 40`);
      }

      if (depth !== 16) {
        t.fail(`Invalid depth, expected 16 but got ${depth}`);
      }

      if (color !== false) {
        t.fail(`Invalid color, expected false but got ${color}`);
      }

      try {
        const grayscaleData = png.grayscaleData();
        if (grayscaleData.length !== data.length / 4) {
          t.fail('Invalid grayscale conversion');
        }

        const propData = png.propData(true, true);
        if (propData.length !== grayscaleData.length) {
          t.fail('Invalid grayscale conversion');
        }
        const min = propData.reduce((p, c) => p < c ? p : c, 1);
        const tol = 1e-3;
        if (min > tol) {
          t.fail(`The minimum in proportions should be 0 not ${min}`);
        }
        const max = propData.reduce((p, c) => p > c ? p : c, -1);
        if (max < 1 - tol) {
          t.fail(`The max in proportions should be 1 not ${max}`);
        }
      }
      catch (e) {
        t.fail(`Error: ${e.message}`);
      }

      t.pass('completed');
      t.end();
    });
});
