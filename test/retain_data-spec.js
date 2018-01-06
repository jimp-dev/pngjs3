#!/usr/bin/env babel-node
import fs from 'fs';
import { PNG } from '../lib/png';
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

                  const org = PNG.sync.read(fs.readFileSync(readFileName));
                  const out = PNG.sync.read(fs.readFileSync(outFileName));

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
})
