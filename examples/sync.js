#!/usr/bin/env node
import fs from 'fs';
import { sync as PNGSync } from '../lib';

const srcFname = process.argv[2];
const dstFname = process.argv[3] || 'out.png';

// Read a PNG file
const data = fs.readFileSync(srcFname);
// Parse it
const png = PNGSync.read(data, {
  filterType: -1,
});

// Pack it back into a PNG data
const buff = PNGSync.write(png);

// Write a PNG file
fs.writeFileSync(dstFname, buff);
