// @flow
import Stream, { type Readable, type Writable } from 'stream';
import { produce } from 'immer';
import { ParserAsync as Parser } from './parser';
import { PackerAsync as Packer } from './packer';
import * as propData from './propData';
import _adjustGamma from './adjustGamma';
import _bitblt from './bitblt';

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

type Props = {|
  skipRescale?: boolean,
  width?: number,
  height?: number,
  initGrayscaleData?: boolean,
  initPropData?: {| shrinkMax?: boolean, shrinkMin?: boolean |},
  fill?: boolean,
|};

type Store = {|
  data: ?Buffer,
  shape: {|
    width: number,
    height: number,
  |},
  gamma: number,
  color: boolean | void,
  depth: number | void,
  grayscaleData: Uint8Array | Uint16Array | void,
  propData: Float32Array | void,
  config: {|
    postParse: {|
      initGrayscaleData: ?boolean,
      initPropData?: {| shrinkMax?: boolean, shrinkMin?: boolean |},
    |},
  |},
|};

// $FlowFixMe
class PNG extends Stream {
  store: Store;

  constructor(options: Props = ({}: any)) {
    super(options);
    const {
      width, height, fill = false,
      initGrayscaleData, initPropData,
    } = options;

    let data: ?Buffer;
    if (width && width > 0 && height && height > 0) {
      const bufferSize = 4 * width * height;
      if (fill) {
        data = Buffer.alloc(bufferSize, 0);
      }
      else {
        data = Buffer.alloc(bufferSize);
      }
    }

    this.store = {
      data,
      shape: {
        // coerce pixel dimensions to integers (also coerces undefined -> 0):
        width: Math.floor(width || 0),
        height: Math.floor(height || 0),
      },
      gamma: 0,
      color: undefined,
      depth: undefined,
      grayscaleData: undefined,
      propData: undefined,
      config: {
        postParse: { initGrayscaleData, initPropData },
      },
    };


    this.readable = this.writable = true;

    this._parser = new Parser(options);

    this._parser.on('error', this.emit.bind(this, 'error'));
    this._parser.on('close', this._handleClose.bind(this));
    this._parser.on('metadata', this._metadata.bind(this));
    this._parser.on('gamma', this._gamma.bind(this));
    this._parser.on('parsed', function(parsedData: Buffer) {
      this.store = produce<Store>(this.store, (draft) => {
        draft.data = parsedData;
      });

      this._postParsed();
      this.emit('parsed', parsedData);
    }.bind(this));

    this._packer = new Packer(options);
    this._packer.on('data', this.emit.bind(this, 'data'));
    this._packer.on('end', this.emit.bind(this, 'end'));
    this._parser.on('close', this._handleClose.bind(this));
    this._packer.on('error', this.emit.bind(this, 'error'));
  }

  serialize() {
    return this.store;
  }

  static deserialize(storeData: Store) {
    const recreated = new PNG();
    recreated.store = storeData;
    return recreated;
  }

  get width() {
    return this.store.shape.width;
  }

  set width(width: number) {
    this.store = produce<Store>(this.store, (draft) => {
      draft.shape.width = width;
    });
  }

  get height() {
    return this.store.shape.height;
  }

  set height(height: number) {
    this.store = produce<Store>(this.store, (draft) => {
      draft.shape.height = height;
    });
  }

  get shape() {
    return this.store.shape;
  }

  get data() {
    return this.store.data;
  }

  set data(newData: ?Buffer) {
    this.store = produce<Store>(this.store, (draft) => {
      draft.data = newData;
      draft.propData = undefined;
      draft.grayscaleData = undefined;
    });
  }

  get gamma() {
    return this.store.gamma;
  }

  set gamma(newGamma: number) {
    this.store = produce<Store>(this.store, (draft) => {
      draft.gamma = newGamma;
    });
  }

  get color() {
    return this.store.color;
  }

  get depth() {
    return this.store.depth;
  }


  _postParsed = () => {
    this.store = produce<Store>(this.store, (draft) => {
      draft.grayscaleData = undefined;
      draft.propData = undefined;
    });

    const { initGrayscaleData, initPropData } = this.store.config.postParse;
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
    this.store = produce<Store>(this.store, (draft) => {
      draft.shape.width = width;
      draft.shape.height = height;
      draft.color = color;
      draft.depth = depth;
    });

    this.emit('metadata', metadata);
  }

  _gamma(gamma: number) {
    this.store = produce<Store>(this.store, (draft) => {
      draft.gamma = gamma;
    });
  }

  _handleClose() {
    if (!this._parser.writable && !this._packer.readable) {
      this.emit('close');
    }
  }

  bitblt(props: {|
    dst: PNG,
    srcX?: number | void, srcY?: number | void,
    width?: number | void, height?: number | void,
    deltaX?: number | void, deltaY?: number | void,
  |}) {
    _bitblt({ src: this, ...props });
    return this;
  }

  adjustGamma() {
    _adjustGamma(this);
    return this;
  }

  initGrayscaleData() {
    const { data, depth, color } = this;
    if (!data) {
      throw new Error('The initGrayscaleData() called before receiving data');
    }

    if (depth === undefined) {
      throw new Error('Unknown depth');
    }

    if (color === undefined) {
      throw new Error('Unknown color status');
    }

    const destLen = data.length / 4;
    let outData;
    if (depth <= 8) {
      outData = new Uint8Array(destLen);
    }
    else {
      outData = new Uint16Array(destLen);
    }
    if (color) {
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

    this.store = produce<Store>(this.store, (draft) => {
      draft.grayscaleData = outData;
    });
  }

  // Retrieve mono data without alpha channel
  grayscaleData() {
    const { data } = this;
    if (!data) {
      throw new Error('Invalid call - no data to convert');
    }

    if (!this.store.grayscaleData) {
      this.initGrayscaleData();
    }

    return this.store.grayscaleData;
  }

  initPropData(shrinkMin: boolean = false, shrinkMax: boolean = false) {
    let propDataOutput: ?Float32Array;
    const { width, height, depth } = this;
    if (depth === undefined) {
      throw new Error('Unknown image depth');
    }

    if (this.color) {
      const { data } = this;
      if (!data) {
        throw new Error('No data to init proportions for');
      }

      propDataOutput = propData.color(
        data,
        shrinkMin,
        shrinkMax,
        { width, height, depth },
      );
    }
    else {
      const data = this.grayscaleData();
      if (!data) {
        throw new Error('No data to init proportions for');
      }
      propDataOutput = propData.grayscale(
        data,
        shrinkMin,
        shrinkMax,
        { width, height, depth },
      );
    }

    this.store = produce<Store>(this.store, (draft) => {
      // $FlowFixMe - for some reasone Flow doesn't get that propDataOutput cannot be null :-(
      draft.propData = propDataOutput;
    });
  }

  // Retrieve colors as proportions instead of integers
  // if you want to limit the max proporiton to the bufferEqual
  // max/min value then set the shrinkMax/shrinkMin.
  propData(shrinkMin: boolean = false, shrinkMax: boolean = false) {
    const { data } = this;
    if (!data) {
      throw new Error('Invalid call - no data to convert');
    }

    if (!this.store.propData) {
      this.initPropData(shrinkMin, shrinkMax);
    }

    return this.store.propData;
  }

  // Move propData into a threshold clamped outData
  propData2ImageClamped(
    clampedDataArray: Uint8ClampedArray,
    lowerThreshold: number = 0,
    upperThreshold: number = 1,
    maxValue: number = 255,
  ) {
    if (lowerThreshold < 0) {
      throw new Error('Invalid lower threshold, can\'t be less than 0');
    }

    if (lowerThreshold > upperThreshold) {
      throw new Error('lower threshold should be below the upper threshold');
    }

    const pData = this.propData();
    if (!pData) {
      throw Error('No propData');
    }

    const inflateBy = maxValue / (1 - lowerThreshold - (1 - upperThreshold));
    if (clampedDataArray.length === pData.length) {
      for (let pos = 0; pos < pData.length; pos += 1) {
        if ((pos + 1) % 4 === 0) {
          clampedDataArray[pos + 3] = 255; // Alpha channel
        }
        else {
          const clr = (pData[pos] - lowerThreshold) * inflateBy;
          clampedDataArray[pos] = clr;
        }
      }
    }
    else if (clampedDataArray.length === pData.length * (4 / 3)) {
      for (let i = 0; i < pData.length; i += 1) {
        const pos = i * 4;
        const propPos = i * 3;
        clampedDataArray[pos] = (pData[propPos] - lowerThreshold) * inflateBy;
        clampedDataArray[pos + 1] = (pData[propPos + 1] - lowerThreshold) * inflateBy;
        clampedDataArray[pos + 2] = (pData[propPos + 2] - lowerThreshold) * inflateBy;
        clampedDataArray[pos + 3] = 255; // Alpha channel
      }
    }
    else if (clampedDataArray.length === pData.length * 4) {
      for (let i = 0; i < pData.length; i += 1) {
        const pos = i * 4;
        const clr = (pData[i] - lowerThreshold) * inflateBy;
        clampedDataArray[pos] = clr;
        clampedDataArray[pos + 1] = clr;
        clampedDataArray[pos + 2] = clr;
        clampedDataArray[pos + 3] = 255; // Alpha channel
      }
    }
    else {
      throw new Error(`Invalid buffer lenghts, expected ${clampedDataArray.length} but got ${pData.length}`);
    }
    return clampedDataArray;
  }
}

export default PNG;
