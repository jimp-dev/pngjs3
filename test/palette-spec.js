#!/usr/bin/env babel-node
import fs from 'fs';
import { PNG } from '../lib/png';
import test from 'tape';
import bufferEqual from 'buffer-equal';

const file = 'palette.png';
test.only('convert async - ' + file, function(t) {
  t.timeoutAfter(1000 * 60 * 5);

  fs.createReadStream(__dirname + '/imgs/' + file)
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

                var out = fs.readFileSync(__dirname + '/imgs/' + file);
                var ref = fs.readFileSync(__dirname + '/imgs/out_' + file);

                var isBufferEqual = bufferEqual(out, ref);
                t.ok(isBufferEqual, 'compares with working file ok');

                if (!isBufferEqual) {
                  console.log(out.length, ref.length);
                }
              }
              else {
                t.fail('No file created');
              }
              t.end();
            }));
    });
});
