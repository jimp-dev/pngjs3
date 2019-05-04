import zlib from 'browserify-zlib';
import inflateSync from '../sync-inflate';
import SyncReader from '../sync-reader';
import { parseSync as filterSync } from '../filter';
import dataToBitMap from '../dataToBitMap';
import formatNormaliser from '../format-normaliser';
import Parser from './parser';

/* eslint-disable max-statements */
let hasSyncZlib = true;
if (!zlib.deflateSync) {
  hasSyncZlib = false;
}

export default function(buffer, options = {}) {
  if (!hasSyncZlib) {
    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
  }

  let err;
  function handleError(_err_) {
    err = _err_;
  }

  let metaData;
  function handleMetaData(_metaData_) {
    metaData = _metaData_;
  }

  function handleTransColor(transColor) {
    metaData.transColor = transColor;
  }

  function handlePalette(palette) {
    metaData.palette = palette;
  }

  function handleSimpleTransparency() {
    metaData.alpha = true;
  }

  let gamma;
  function handleGamma(_gamma_) {
    gamma = _gamma_;
  }

  let inflateDataList = [];
  function handleInflateData(inflatedData) {
    inflateDataList.push(inflatedData);
  }

  let reader = new SyncReader(buffer);

  let parser = new Parser(options, {
    read: reader.read.bind(reader),
    error: handleError,
    metadata: handleMetaData,
    gamma: handleGamma,
    palette: handlePalette,
    transColor: handleTransColor,
    inflateData: handleInflateData,
    simpleTransparency: handleSimpleTransparency,
  });

  parser.start();
  reader.process();

  if (err) {
    throw err;
  }

  //join together the inflate datas
  let inflateData = Buffer.concat(inflateDataList);
  inflateDataList.length = 0;

  let inflatedData;
  if (metaData.interlace) {
    inflatedData = zlib.inflateSync(inflateData);
  }
  else {
    let rowSize = ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1;
    let imageSize = rowSize * metaData.height;
    inflatedData = inflateSync(inflateData, { chunkSize: imageSize, maxLength: imageSize });
  }
  inflateData = null;

  if (!inflatedData || !inflatedData.length) {
    throw new Error('bad png - invalid inflate data response');
  }

  let unfilteredData = filterSync(inflatedData, metaData);
  inflateData = null;

  let bitmapData = dataToBitMap(unfilteredData, metaData);
  unfilteredData = null;

  let normalisedBitmapData = formatNormaliser(bitmapData, metaData, options.skipRescale);

  metaData.data = normalisedBitmapData;
  metaData.gamma = gamma || 0;

  return metaData;
}
