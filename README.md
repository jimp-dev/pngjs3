[![Build Status](https://travis-ci.org/gforge/pngjs3.svg?branch=master)](https://travis-ci.org/gforge/pngjs3) [![Build status](https://ci.appveyor.com/api/projects/status/tb8418jql1trkntd/branch/master?svg=true)](https://ci.appveyor.com/project/gforge/pngjs32/branch/master)
[![npm version](https://badge.fury.io/js/pngjs3.svg)](http://badge.fury.io/js/pngjs3)
[![NPM downloads](https://img.shields.io/npm/dm/pngjs3)](https://img.shields.io/npm/dm/pngjs3)

# pngjs3

Simple PNG encoder/decoder for Node.js and browsers with no dependencies.

A fork from [pngjs](https://github.com/lukeapage/pngjs). The
package is prepared for the browser and there are some changes in the exports. The
`pngjs` has been extended with the following enhancements:

- `skipRescale` that allows retrieval of 16-bit data if input was 16-bit
- `grayscaleData` for retrieving the grayscale bitmap (_note_ ignores alpha channel and caches the grayscale conversion&dagger;)
- `propData` for retrieving the proportional values (_note_ ignores alpha channel and caches the proportional conversion&dagger;)

&dagger; If you manipulate the `data` property of the object directly the conversions will not be recalculated due to the cache.

The pngjs had the follow enhancements compared to the original:

- Support for reading 1, 2, 4 & 16 bit files
- Support for reading interlace files
- Support for reading `tTRNS` transparent colours
- Support for writing colortype 0 (grayscale), colortype 2 (RGB), colortype 4 (grayscale alpha) and colortype 6 (RGBA)
- Sync interface as well as async
- API compatible with pngjs and node-pngjs

Known lack of support for:

- Extended PNG e.g. Animation
- Writing in colortype 3 (indexed color)

# Table of Contents

- [Requirements](#requirements)
- [Comparison Table](#comparison-table)
- [Tests](#tests)
- [Installation](#installation)
- [Browser](#browser)
- [Example](#example)
- [Async API](#async-api)
- [Sync API](#sync-api)
- [Changelog](#changelog)

# Requirements

- Node.js v10 or later

# Comparison Table

| Name          | Forked From | Sync | Async | 16 Bit | 1/2/4 Bit | Interlace | Gamma  | Encodes | Tested |
| ------------- | ----------- | ---- | ----- | ------ | --------- | --------- | ------ | ------- | ------ |
| pngjs3        | pngjs       | Yes  | Yes   | Yes    | Yes       | Yes       | Yes    | Yes     | Yes    |
| pngjs         |             | Yes  | Yes   | Yes    | Yes       | Yes       | Yes    | Yes     | Yes    |
| node-png      | pngjs       | No   | Yes   | No     | No        | No        | Hidden | Yes     | Manual |
| png-coder     | pngjs       | No   | Yes   | Yes    | No        | No        | Hidden | Yes     | Manual |
| pngparse      |             | No   | Yes   | No     | Yes       | No        | No     | No      | Yes    |
| pngparse-sync | pngparse    | Yes  | No    | No     | Yes       | No        | No     | No      | Yes    |
| png-async     |             | No   | Yes   | No     | No        | No        | No     | Yes     | Yes    |
| png-js        |             | No   | Yes   | No     | No        | No        | No     | No      | No     |

Native C++ node decoders:

- png
- png-sync (sync version of above)
- pixel-png
- png-img

# Tests

Tested using [PNG Suite](http://www.schaik.com/pngsuite/). We read every file into pngjs, output it in standard 8bit colour, synchronously and asynchronously, then compare the original with the newly saved images.

To run the tests, fetch the repo (tests are not distributed via npm) and install with `npm i`, run `npm test`.

The only thing not converted is gamma correction - this is because multiple vendors will do gamma correction differently, so the tests will have different results on different browsers.

# Installation

```
$ npm install pngjs3  --save
```

or with yarn

```
$ yarn add pngjs3
```

# Browser

The package has been build with browser support using `browserify-zlib` instead of NodeJS' `zlib`.

# Example

```js
import fs from 'fs';
import PNG from 'pngjs3';

fs.createReadStream('in.png')
  .pipe(
    new PNG({
      filterType: 4,
    }),
  )
  .on('parsed', function () {
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var idx = (this.width * y + x) << 2;

        // invert color
        this.data[idx] = 255 - this.data[idx];
        this.data[idx + 1] = 255 - this.data[idx + 1];
        this.data[idx + 2] = 255 - this.data[idx + 2];

        // and reduce opacity
        this.data[idx + 3] = this.data[idx + 3] >> 1;
      }
    }

    this.pack().pipe(fs.createWriteStream('out.png'));
  });
```

For more examples see `examples` folder.

# Async API

As input any color type is accepted (grayscale, rgb, palette, grayscale with alpha, rgb with alpha) with 8 & 16 bit per sample (channel) are the supported bit depths. Interlaced mode is not supported.

## Class: PNG

`PNG` is a readable and writable `Stream`.

### Options

- `id` - An optional identifier can be provided if you want to be able to track this object in memory.
- `width` - use this with `height` if you want to create png from scratch.
- `height` - as above.
- `checkCRC` - whether parser should be strict about checksums in source stream (default: `true`).
- `deflateChunkSize` - chunk size used for deflating data chunks, this should be power of 2 and must not be less than 256 and more than 32\*1024 (default: 32 kB).
- `deflateLevel` - compression level for deflate (default: 9).
- `deflateStrategy` - compression strategy for deflate (default: 3).
- `deflateFactory` - deflate stream factory (default: `zlib.createDeflate`).
- `filterType` - png filtering method for scanlines (default: -1 => auto, accepts array of numbers 0-4).
- `colorType` - the output colorType - see constants. 0 = grayscale, no alpha, 2 = color, no alpha, 4 = grayscale & alpha, 6 = color & alpha. Default currently 6, but in the future may calculate best mode.
- `inputColorType` - the input colorType - see constants. Default is 6 (RGBA).
- `bitDepth` - the bitDepth of the output, 8 or 16 bits. Input data is expected to have this bit depth.
  16 bit data is expected in the system endianness (Default: 8).
- `inputHasAlpha` - whether the input bitmap has 4 bytes per pixel (rgb and alpha) or 3 (rgb - no alpha).
- `bgColor` - an object containing red, green, and blue values between 0 and 255.
  that is used when packing a PNG if alpha is not to be included (default: 255,255,255).
- `skipRescale` - set to true if you want to skip the rescaling to 8-bit bitmap. This is good if you wish to retain a 16-bit bitmap datastructure.
- `initGrayscaleData` - if you want to initialize the grayscale conversion of the RGBA data for the `grayscaleData` call &dagger;.
- `initPropData` - boolean or an object with the arguments to `initPropData` for initializing the `propData` &dagger;.

&dagger; These functions are useful if you wish to do repeated manipulations to the image and as image manipulation is time consuming it is beneficial to initiate the data from start.

### Event "metadata"

`function(metadata) { }`
Image's header has been parsed, metadata contains this information:

- `width` image size in pixels
- `height` image size in pixels
- `palette` image is paletted
- `color` image is not grayscale
- `alpha` image contains alpha channel
- `interlace` image is interlaced

### Event: "parsed"

`function(data) { }`
Input image has been completely parsed, `data` is complete and ready for modification.

### Event: "error"

`function(error) { }`

### png.parse(data, [callback])

Parses PNG file data. Can be `String` or `Buffer`. Alternatively you can stream data to instance of PNG.

Optional `callback` is once called on `error` or `parsed`. The callback gets
two arguments `(err, data)`.

Returns `this` for method chaining.

#### Example

```js
new PNG({ filterType: 4 }).parse(imageData, function (error, data) {
  console.log(error, data);
});
```

### png.pack()

Starts converting data to PNG file Stream.

Returns `this` for method chaining.

### png.destroy()

Calling `destroy()` is entirely optional but browser memory management is both tricky and important, this is especially important here as images are take up a **lot** of space. The problem is also due to that the async procedures associated with the class can cause unwanted side-effects such memory leaks as we expect the object to have been deleted together with a DOM-node. The call tries to clear all the ArrayBuffers both own buffers and other sub-buffers that can be problematic.

### bitblt({ dst, srcX, srcY, width, height, deltaX, deltaY })

Helper for image manipulation, copies a rectangle of pixels from current (i.e. the source) image
(`srcX`, `srcY`, `width`, `height`) to `dst` image (at `deltaX`, `deltaY`).

Returns `this` for method chaining.

For example, the following code copies the top-left 100x50 px of `in.png` into dst and writes it to `out.png`:

```js
const dst = new PNG({ width: 100, height: 50 });
fs.createReadStream('in.png')
  .pipe(new PNG())
  .on('parsed', function () {
    this.bitblt({
      dst,
      srcX: 0,
      srcY: 0,
      width: 100,
      height: 150,
      deltaX: 0,
      deltaY: 0,
    });
    dst.pack().pipe(fs.createWriteStream('out.png'));
  });
```

Not that the package exports `bitblt` that takes the additionalargument `src`;

### Property: adjustGamma()

Helper that takes data and adjusts it to be gamma corrected. Note that it is not 100% reliable with transparent colours because that requires knowing the background colour the bitmap is rendered on to.

In tests against PNG suite it compared 100% with chrome on all 8 bit and below images. On IE there were some differences.

The following example reads a file, adjusts the gamma (which sets the gamma to 0) and writes it out again, effectively removing any gamma correction from the image.

```js
fs.createReadStream('in.png')
  .pipe(new PNG())
  .on('parsed', function () {
    this.adjustGamma();
    this.pack().pipe(fs.createWriteStream('out.png'));
  });
```

### Property: width

Width of image in pixels

### Property: height

Height of image in pixels

### Property: shape

Object with height and width

### Property: data

Buffer of image pixel data. Every pixel consists 4 bytes: R, G, B, A (opacity).

### Property: gamma

Gamma of image (0 if not specified)

## Serializing and deserializing

When using libraries suchs as Redux it is "highly recommended that you only put plain serializable objects, arrays, and primitives into your store". For this purpose PNGJS has implemented the `serialize()` and `static deserialize()` methods.

```js
import PNG from 'pngjs3';

myPNG = new PNG();
...

const data2store = myPNG.serialize();
...

const myRecreatedObject = PNG.deserialize(data2store);

// Note that:
console.log(myRecreatedObject !== myPNG, 'A new object has been created');
console.log(myRecreatedObject.storage === myPNG.storage, 'But the storage (i.e. data) is the same');
```

### Immutability

The storage in the PNG-object is immutable through `immer`. This means that any changes to the storage will propagate from subitem to the top item. This allows for efficient comparison `store === prevStore`.

## Packing a PNG and removing alpha (RGBA to RGB)

When removing the alpha channel from an image, there needs to be a background color to correctly
convert each pixel's transparency to the appropriate RGB value. By default, pngjs will flatten
the image against a white background. You can override this in the options:

```js
import fs from 'fs';
import PNG from 'pngjs3';

fs.createReadStream('in.png')
  .pipe(
    new PNG({
      colorType: 2,
      bgColor: {
        red: 0,
        green: 255,
        blue: 0,
      },
    }),
  )
  .on('parsed', function () {
    this.pack().pipe(fs.createWriteStream('out.png'));
  });
```

# Sync API

## read(buffer)

Take a buffer and returns a PNG image. The properties on the image include the meta data and `data` as per the async API above.

```js
import { sync as PNGSync } from 'pngjs3';

const data = fs.readFileSync('in.png');
const png = PNGSync.read(data);
```

## write(png)

Take a PNG image and returns a buffer. The properties on the image include the meta data and `data` as per the async API above.

```js
import { sync as PNGSync } from 'pngjs3';

const data = fs.readFileSync('in.png');
const png = PNGSync.read(data);
const options = { colorType: 6 };
const buffer = PNGSync.write(png, options);
fs.writeFileSync('out.png', buffer);
```

## Adjust Gamma

Adjusts the gamma of a sync image. See the async adjustGamma.

```js
import { adjustGamma } from 'pngjs3';

const data = fs.readFileSync('in.png');
const png = PNGSync.read(data);
adjustGamma(png);
```

# Changelog

### --> 6.1.0 - 30/10/2020

- Added optional ID for easier tracking the object in memory
- Added `destroy()` to PNG class. Browser memory management could potentially be problematic
  as the async procedures associated with the class can cause unwanted side-effects such
  memory leaks as we expect the object to have been deleted together with a DOM-node.

### --> 6.0.0 - 28/10/2020

- BREAKING - Sync version now throws if there is unexpected content at the end of the stream.
- BREAKING - Drop support for node 10 (Though nothing incompatible in this release yet)

### --> 5.1.10 - 21/07/2020

- Update package dependencies
- Fixed rollup issues
- Removed circular dependency

### --> 5.1.9 - 25/05/2020

- Update package dependencies
- Added changes implemented in original pngjs

### --> 5.1.7 - 05/04/2020

- Update package dependencies
- Converted Buffer() to Buffer.from & Buffer.alloc
- Drop support for Node v8

### --> 5.1.5 - 25/08/2019

- Update package dependencies

### 5.1.0 - 07/05/2019

- Implemented immutable store (setters and getters should allow for the same functionality as before) - issue #49
- There is a `shape` attribute with the `width` and the `height`
- For storage you can now use `serialize()` and `static deserialize()`

### 5.0.4 - 04/05/2019

- Added with commits from original fork (https://github.com/lukeapage/pngjs) implemented fixes and improvements should now match
- Updated packages

### 5.0.3 - 23/04/2019

- Homepage url + package updates

### 5.0.2 - 17/04/2019

- Updated packages

### 5.0.1 - 02/12/2019

- Updated packages

### 5.0.0 - 01/01/2019

- BREAKING: The sync is exported as sync and no longer a static member of the PNG-class
- Default export is now the PNG class
- Separate export for `adjustGamma`, `bitblt` and `sync`
- The `bitblt` now expects an object as argument due to too many arguments
- Updated the README to match the new structure

### 4.0.0 - 03/08/2018

- Change to browserify-zlib (causes one async test case to fail :-()

### 3.6.2 - 03/08/2018

- Change to rollup - now includes es6 module, umd and cjs
- Package updates
- Fixes to buggy flow interface

### 3.5.0 - 17/01/2018

- Added propData2ImageClamped for copying propData into Uint8ClampedArray

### 3.4.2 - 8/01/2018

- Fixed bug in propData
- Changed min/max value search to for loop with break

### 3.4.1 - 7/01/2018

- Fixed bug in grayscaleData for rgb
- Fixed Flow typings with all the sub-elements

### 3.4.0 - 22/12/2017

- Fork to pngjs3
- Added browserify for browser loading
- Added propData and grayscaleData
- Added Flow typings

### 3.3.1 - 15/11/2017

- Bugfixes and removal of es6

### 3.3.1 - 15/11/2017

- Bugfixes and removal of es6

### 3.3.0

- Add writing 16 bit channels and support for grayscale input

### 3.2.0 - 30/04/2017

- Support for encoding 8-bit grayscale images

### 3.1.0 - 30/04/2017

- Support for pngs with zlib chunks that are malformed after valid data

### 3.0.1 - 16/02/2017

- Fix single pixel pngs

### 3.0.0 - 03/08/2016

- Drop support for node below v4 and iojs. Pin to 2.3.0 to use with old, unsupported or patched node versions.

### 2.3.0 - 22/04/2016

- Support for sync in node 0.10

### 2.2.0 - 04/12/2015

- Add sync write api
- Fix newfile example
- Correct comparison table

### 2.1.0 - 28/10/2015

- rename package to pngjs
- added 'bgColor' option

### 2.0.0 - 08/10/2015

- fixes to readme
- _breaking change_ - bitblt on the png prototype now doesn't take a unused, unnecessary src first argument

### 1.2.0 - 13/09/2015

- support passing colorType to write PNG's and writing bitmaps without alpha information

### 1.1.0 - 07/09/2015

- support passing a deflate factory for controlled compression

### 1.0.2 - 22/08/2015

- Expose all PNG creation info

### 1.0.1 - 21/08/2015

- Fix non square interlaced files

### 1.0.0 - 08/08/2015

- More tests
- source linted
- maintainability refactorings
- async API - exceptions in reading now emit warnings
- documentation improvement - sync api now documented, adjustGamma documented
- breaking change - gamma chunk is now written. previously a read then write would destroy gamma information, now it is persisted.

### 0.0.3 - 03/08/2015

- Error handling fixes
- ignore files for smaller npm footprint

### 0.0.2 - 02/08/2015

- Bugfixes to interlacing, support for transparent colours

### 0.0.1 - 02/08/2015

- Initial release, see pngjs for older changelog.

# License

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
