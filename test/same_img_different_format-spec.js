#!/usr/bin/env babel-node
import fs from 'fs';
import PNG, { sync as PNGSync } from '../lib';
import test from 'tape';
import bufferEqual from 'buffer-equal';

const debugBufferMismatch = ({ rgbData, grayData }) => {
  if (!rgbData) {
    console.log('No rgbData');
    return;
  }
  if (!grayData) {
    console.log('No grayData');
    return;
  }

  const errs = [];
  for (let i = 0; i < rgbData.length; i += 1) {
    if (rgbData[i] !== grayData[i]) {
      errs[errs.length] = i;
      if (errs.length > 20) {
        break;
      }
    }
  }
  console.log(errs.map((i) => `[${i}] ${rgbData[i]} (rgb) != ${grayData[i]} (grayscale)`));
};

test('Check same image saved in different modes generate the same buffers', function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const rgbGradient = __dirname + '/imgs/img8_gradient_rgb.png';
  const { data: grayData } = PNGSync.read(fs.readFileSync(grayscaleGradient));
  const { data: rgbData } = PNGSync.read(fs.readFileSync(rgbGradient));

  let isBufferEqual = bufferEqual(grayData, rgbData);
  t.ok(isBufferEqual, 'compares with grayscale file ok');
  if (!isBufferEqual) {
    debugBufferMismatch({
      rgbData,
      grayData,
    });
  }
  t.end();
});

test('Check same image saved in different modes generate the same buffers in async with stream', function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const rgbGradient = __dirname + '/imgs/img8_gradient_rgb.png';
  const grayPNG = new PNG();
  const rgbPNG = new PNG();
  fs.createReadStream(grayscaleGradient)
    .pipe(grayPNG)
    .on('error', function(error) {
      t.fail(`Failed to convert grayscale file: ${error.message}`);
      t.end();
    })
    .on('parsed', (grayData) => {
      fs.createReadStream(rgbGradient)
        .pipe(rgbPNG)
        .on('error', function(error) {
          t.fail(`Failed to convert rgb file: ${error.message}`);
          t.end();
        })
        .on('parsed', (rgbData) => {
          let isBufferEqual = bufferEqual(rgbData, grayData);
          t.ok(isBufferEqual, 'compares with grayscale file ok');
          if (!isBufferEqual) {
            debugBufferMismatch({
              rgbData,
              grayData,
            });
          }
          t.end();
        });
    });
});

test('Check same image saved in different modes generate the same buffers in async with initGrayscaleData', function(t) {
  t.timeoutAfter(1000 * 60 * 5);
  const options = {
    initGrayscaleData: true,
  };

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const rgbGradient = __dirname + '/imgs/img8_gradient_rgb.png';
  const grayPNG = new PNG(options);
  const rgbPNG = new PNG(options);
  fs.createReadStream(grayscaleGradient)
    .pipe(grayPNG)
    .on('error', function(error) {
      t.fail(`Failed to convert grayscale file: ${error.message}`);
      t.end();
    })
    .on('parsed', (grayData) => {
      fs.createReadStream(rgbGradient)
        .pipe(rgbPNG)
        .on('error', function(error) {
          t.fail(`Failed to convert rgb file: ${error.message}`);
          t.end();
        })
        .on('parsed', (rgbData) => {
          let isBufferEqual = bufferEqual(rgbData, grayData);
          t.ok(isBufferEqual, 'compares with grayscale file ok');
          if (!isBufferEqual) {
            debugBufferMismatch({
              rgbData,
              grayData,
            });
          }
          t.end();
        });
    });
});

test('Check same image saved in different modes generate the same buffers in async - alternative syntax', function(t) {
  t.timeoutAfter(1000 * 60 * 5);
  const options = {
    skipRescale: true,
    initGrayscaleData: true,
    initPropData: { shrinkMax: true, shrinkMin: true },
  };

  const grayscaleGradient = __dirname + '/imgs/img8_gradient.png';
  const rgbGradient = __dirname + '/imgs/img8_gradient_rgb.png';
  let buf = fs.readFileSync(grayscaleGradient);
  const gray = new PNG(options);
  gray.parse(buf, (error, grayData) => {
    buf = fs.readFileSync(rgbGradient);
    const rgb = new PNG(options);
    rgb.parse(buf, (error2, rgbData) => {
      let isBufferEqual = bufferEqual(rgbData.data, grayData.data);
      t.ok(isBufferEqual, 'compares with grayscale file ok');

      if (!isBufferEqual) {
        debugBufferMismatch({
          rgbData: rgbData.grayscaleData(),
          grayData: grayData.grayscaleData(),
        });
      }
      t.end();
    });
  });
});
