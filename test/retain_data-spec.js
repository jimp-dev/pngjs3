#!/usr/bin/env babel-node
import fs from 'fs';
import PNG, { sync as PNGSync } from '../lib';
import test from 'tape';
import bufferEqual from 'buffer-equal';

['palette.png', 'grayscale_16bit.png'].forEach((file) => {
  test(`Check files that processed files retain the original quality - testing ${file}`, function(t) {
    t.timeoutAfter(1000 * 60 * 5);

    const readFileName = __dirname + '/imgs/' + file;
    fs.createReadStream(readFileName)
      .pipe(new PNG())
      .on('error', function(error) {
        t.fail('Async: Unexpected error parsing..' + file + '\n' + error.message + '\n' + error.stack);
        t.end();
      })
      .on('parsed', function() {
        const outFileName = __dirname + '/imgs/out_' + file;
        // eslint-disable-next-line
        this.pack()
          .pipe(
            fs.createWriteStream(outFileName)
              .on('finish', function() {
                if (fs.existsSync(outFileName)) {
                  t.pass('completed');

                  const org = PNGSync.read(fs.readFileSync(readFileName));
                  const out = PNGSync.read(fs.readFileSync(outFileName));

                  var isBufferEqual = bufferEqual(org.data, out.data);
                  t.ok(isBufferEqual, 'compares with working file ok');
                }
                else {
                  t.fail(`No file found at ${outFileName}`);
                }
                t.end();
              }));
      });
  });
});

test('Check serialization', function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  const readFileName = __dirname + '/imgs/palette.png';
  const pngObject = new PNG();
  fs.createReadStream(readFileName)
    .pipe(pngObject)
    .on('error', function(error) {
      t.fail('Async: Unexpected error parsing palett.png:\n' + error.message + '\n' + error.stack);
      t.end();
    })
    .on('parsed', function() {
      const tmp = pngObject.serialize();
      const recreated = PNG.deserialize(tmp);
      t.ok(recreated !== pngObject, 'Not equal object');
      t.ok(recreated.store === pngObject.store, 'Equal storage');
      recreated.width = 12;
      t.ok(recreated.store !== pngObject.store, 'Storage should be immutable');
      t.ok(recreated.shape !== pngObject.shape, 'Storage should be immutable');
      t.end();
    });
});