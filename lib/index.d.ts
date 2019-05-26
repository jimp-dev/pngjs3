import Stream, { Readable, Writable } from 'stream';

export interface Metadata {
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

export interface PropDataInit {
  shrinkMax?: boolean,
  shrinkMin?: boolean,
}

export interface Props {
  skipRescale?: boolean,
  width?: number,
  height?: number,
  initGrayscaleData?: boolean,
  initPropData?: PropDataInit,
  fill?: boolean,
}

export interface Shape {
  width: number,
  height: number,
}

export interface Store {
  data: Buffer | void,
  shape: Shape,
  gamma: number,
  color: boolean | void,
  depth: number | void,
  grayscaleData: Uint8Array | Uint16Array | void,
  propData: Float32Array | void,
  config: {
    postParse: {
      initGrayscaleData: boolean | void,
      initPropData?: { shrinkMax?: boolean, shrinkMin?: boolean },
    },
  },
}

interface BasicBitBltProps {
  srcX?: number | void,
  srcY?: number | void,
  width?: number | void,
  height?: number | void,
  deltaX?: number | void,
  deltaY?: number | void,
}

export type BufferInput = ArrayBuffer | Readable;

export interface Options {
  width?: number;
  height?: number;
  checkCRC?: boolean;
  deflateChunkSize?: number;
  deflateLevel?: number;
  deflateStrategy?: number;
  deflateFactory?: Function;
  filterType?: -1 | 0 | 1 | 2 | 3 | 4;
  colorType?: 0 | 2 | 4 | 6;
  inputColorType?: number;
  bitDepth?: 8 | 16;
  inputHasAlpha?: boolean;
  bgColor?: { red: number; green: number; blue: number };
  skipRescale?: boolean;
  initGrayscaleData?: boolean;
  initPropData?: boolean;
}

export class PNG extends Stream {
  static deserialize(storeData: Store): PNG;
  constructor(options: Options);
  width: number;
  height: number;
  shape: Store['shape'];
  data: Store['data'];
  gamma: Store['gamma'];
  color: Store['color'];
  depth: Store['depth'];
  parse(data: BufferInput, callback?: Function): PNG;
  serialize(): Store;
  write(data: Writable): true;
  end(data: BufferInput): void;
  bitblt(props: BasicBitBltProps & { dst: PNG }): PNG;
  adjustGamma(): PNG;
  initGrayscaleData(): PNG;
  grayscaleData(): PNG;
  initPropData(shrinkMin?: boolean, shrinkMax?: boolean): void;
  propData(shrinkMin?: boolean, shrinkMax?: boolean): void;
  propData2ImageClamped(
    clampedDataArray: Uint8ClampedArray,
    lowerThreshold?: number,
    upperThreshold?: number,
    maxValue?: number,
  ): void;
}

export declare function adjustGamma(src: PNG): void;
export declare function bitblt(props: BasicBitBltProps & { src: PNG; dst: PNG }): void;
export default PNG;

export namespace sync {
  function read(buffer: BufferInput, options: Options): PNG;
  function write(png: PNG, options: Options): PNG;
}