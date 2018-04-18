// @flow
import Stream, { type Readable, type Writable } from 'stream';
import { ParserAsync as Parser } from './parser';
import { PackerAsync as Packer } from './packer';
import * as PNGSync from './png-sync';
import * as propData from './propData';

interface Metadata {
  width: number,
  height: number,
  depth: 1 | 2 | 4 | 8 | 16,
  interlace: boolean,
  palette: boolean,
  color: boolean,
  alpha: boolean,
  bpp: 1 | 2 | 3 | 4,
  colorType: 0 | 2 | 3 | 4 | 6,
}

interface Props {
  width?: number,
  height?: number,
  initGrayscaleData?: boolean,
  initPropData?: boolean | { shrinkMax: boolean, shrinkMin: boolean },
  fill?: boolean,
}

// $FlowFixMe
export class PNG extends Stream {
  width: number;
  height: number;
  color: boolean;
  depth: number;
  _grayscaleData: Uint8Array | Uint16Array | void;
  _propData: ?Float32Array;
  data: ?Buffer;
  gamma: number;

  constructor(options: Props = {}) {
    super(options);
    const {
      width, height,
      initGrayscaleData, initPropData,
    } = options;

    // coerce pixel dimensions to integers (also coerces undefined -> 0):
    this.width = width || 0;
    this.height = height || 0;

    this._configPostParse = { initGrayscaleData, initPropData };

    this.data = this.width > 0 && this.height > 0 ?
      new Buffer(4 * this.width * this.height) : null;

    if (options.fill && this.data) {
      this.data.fill(0);
    }

    this.gamma = 0;
    this.readable = this.writable = true;

    this._parser = new Parser(options);

    this._parser.on('error', this.emit.bind(this, 'error'));
    this._parser.on('close', this._handleClose.bind(this));
    this._parser.on('metadata', this._metadata.bind(this));
    this._parser.on('gamma', this._gamma.bind(this));
    this._parser.on('parsed', function(data) {
      this.data = data;

      this._postParsed();
      this.emit('parsed', data);
    }.bind(this));

    this._packer = new Packer(options);
    this._packer.on('data', this.emit.bind(this, 'data'));
    this._packer.on('end', this.emit.bind(this, 'end'));
    this._parser.on('close', this._handleClose.bind(this));
    this._packer.on('error', this.emit.bind(this, 'error'));

    this._postParsed = this._postParsed.bind(this);
  }

  _postParsed: Function;
  _postParsed() {
    this._grayscaleData = undefined;
    this._propData = undefined;
    const { initGrayscaleData, initPropData } = this._configPostParse;
    if (initGrayscaleData) {
      this.initGrayscaleData();
    }
    if (initPropData) {
      const shrinkMin = initPropData.shrinkMin || false;
      const shrinkMax = initPropData.shrinkMax || false;
      this.initPropData(shrinkMin, shrinkMax);
    }
  }

  pack() {
    if (!this.data || !this.data.length) {
      this.emit('error', 'No data provided');
      return this;
    }

    process.nextTick(function() {
      this._packer.pack(this.data, this.width, this.height, this.gamma);
    }.bind(this));

    return this;
  }

  parse(data: ArrayBuffer | Readable, callback: Function) {
    if (callback) {
      let onParsed, onError;

      onParsed = function() {
        this.removeListener('error', onError);

        callback(null, this);
      }.bind(this);

      onError = function(err) {
        this.removeListener('parsed', onParsed);

        callback(err, null);
      }.bind(this);

      this.once('parsed', onParsed);
      this.once('error', onError);
    }

    this.end(data);
    return this;
  }

  write(data: Writable) {
    this._parser.write(data);
    return true;
  }

  end(data: Readable | ArrayBuffer) {
    this._parser.end(data);
  }

  _metadata(metadata: Metadata) {
    const { width, height, color, depth } = metadata;
    this.width = width;
    this.height = height;
    this.color = color;
    this.depth = depth;

    this.emit('metadata', metadata);
  }

  _gamma(gamma: number) {
    this.gamma = gamma;
  }

  _handleClose() {
    if (!this._parser.writable && !this._packer.readable) {
      this.emit('close');
    }
  }

  // eslint-disable-next-line max-params
  bitblt(
    src: PNG, dst: PNG,
    srcX: number = 0, srcY: number = 0,
    width: number = 0, height: number = 0,
    deltaX: number = 0, deltaY: number = 0,
  ) {
    // coerce pixel dimensions to integers (also coerces undefined -> 0):

    if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
      throw new Error('bitblt reading outside image');
    }

    if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
      throw new Error('bitblt writing outside image');
    }

    const { data } = src;
    if (!data) {
      throw new Error('No data available in src');
    }
    const { data: outData } = dst;
    if (!outData) {
      throw new Error('No data available in dst');
    }

    for (var y = 0; y < height; y++) {
      data.copy(outData,
        ((deltaY + y) * dst.width + deltaX) << 2,
        ((srcY + y) * src.width + srcX) << 2,
        ((srcY + y) * src.width + srcX + width) << 2
      );
    }

    return this;
  }

  adjustGamma(src: PNG) {
    if (src.gamma) {
      const { data } = src;
      if (!data) {
        throw new Error('No data available for object');
      }

      for (var y = 0; y < src.height; y++) {
        for (var x = 0; x < src.width; x++) {
          var idx = (src.width * y + x) << 2;

          for (var i = 0; i < 3; i++) {
            var sample = data[idx + i] / 255;
            sample = Math.pow(sample, 1 / 2.2 / src.gamma);
            data[idx + i] = Math.round(sample * 255);
          }
        }
      }
      src.data = data;
      src.gamma = 0;
    }
    return this;
  }

  initGrayscaleData() {
    const { data } = this;
    if (!data) {
      throw new Error('The initGrayscaleData() called before receiving data');
    }

    const destLen = data.length / 4;
    let outData;
    if (this.depth <= 8) {
      outData = new Uint8Array(destLen);
    }
    else {
      outData = new Uint16Array(destLen);
    }
    if (this.color) {
      const mono = ({ red, green, blue }) => ((0.2125 * red) + (0.7154 * green) + (0.0721 * blue));
      for (let i = 0; i < outData.length; i += 1) {
        const pxPos = i * 4;
        outData[i] = mono({
          red: data[pxPos + 0],
          green: data[pxPos + 1],
          blue: data[pxPos + 2],
        });
      }
    }
    else {
      outData = data.filter((clr, i) => i % 4 === 0);
    }

    this._grayscaleData = outData;
  }

  // Retrieve mono data without aplpha channel
  grayscaleData() {
    const { data } = this;
    if (!data) {
      throw new Error('Invalid call - no data to convert');
    }

    if (!this._grayscaleData) {
      this.initGrayscaleData();
    }

    return this._grayscaleData;
  }

  initPropData(shrinkMin: boolean = false, shrinkMax: boolean = false) {
    if (this.color) {
      const { data } = this;
      if (!data) {
        throw new Error('No data to init proportions for');
      }

      this._propData = propData.color(
        data,
        shrinkMin,
        shrinkMax,
        {
          width: this.width,
          height: this.height,
          depth: this.depth,
        }
      );
    }
    else {
      const data = this.grayscaleData();
      if (!data) {
        throw new Error('No data to init proportions for');
      }

      this._propData = propData.grayscale(
        data,
        shrinkMin,
        shrinkMax,
        {
          width: this.width,
          height: this.height,
          depth: this.depth,
        }
      );
    }
  }

  // Retrieve colors as proportions instead of integers
  // if you want to limit the max proporiton to the bufferEqual
  // max/min value then set the shrinkMax/shrinkMin.
  propData(shrinkMin: boolean = false, shrinkMax: boolean = false) {
    const { data } = this;
    if (!data) {
      throw new Error('Invalid call - no data to convert');
    }

    if (!this._propData) {
      this.initPropData(shrinkMin, shrinkMax);
    }

    return this._propData;
  }
}

PNG.sync = PNGSync;
