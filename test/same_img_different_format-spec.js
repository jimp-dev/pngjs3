#!/usr/bin/env babel-node
import fs from 'fs';
import { PNG } from '../lib/png';
import test from 'tape';
import bufferEqual from 'buffer-equal';

test('Check same image saved in different modes generate the same buffers', function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  const paletteFileName = __dirname + '/imgs/img8_gradient.png';
  const nonPaletteFileName = __dirname + '/imgs/img8_gradient_rgb.png';
  const palette = PNG.sync.read(fs.readFileSync(paletteFileName));
  const nonPalette = PNG.sync.read(fs.readFileSync(nonPaletteFileName));

  var isBufferEqual = bufferEqual(palette.data, nonPalette.data);
  t.ok(isBufferEqual, 'compares with working file ok');
  t.end();
});


test.only('Check same image saved in different modes generate the same buffers in async', function(t) {
  t.timeoutAfter(1000 * 60 * 5);
  const options = {
    skipRescale: true,
    initGrayscaleData: true,
    initPropData: { shrinkMax: true, shrinkMin: true },
  };

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const rgbGrarient = __dirname + '/imgs/img8_gradient_rgb.png';
  let buf = fs.readFileSync(grayscaleGradient);
  const gray = new PNG(options);
  gray.parse(buf, (error, grayData) => {
    buf = fs.readFileSync(rgbGrarient);
    const rgb = new PNG(options);
    rgb.parse(buf, (error2, rgbData) => {
      var isBufferEqual = bufferEqual(rgbData.data, grayData.data);
      t.ok(isBufferEqual, 'compares with working file ok');
      if (!isBufferEqual) {
        const errs = [];
        for (let i = 0; i < rgbData.data.length; i += 1) {
          if (rgbData.data[i] !== grayData.data[i]) {
            errs[errs.length] = i;
            if (errs.length > 20) {
              break;
            }
          }
        }
        console.log(errs.map((i) => `[${i}] ${rgbData.data[i]} != ${grayData.data[i]}`));
      }
      t.end();
    });
  });
});
