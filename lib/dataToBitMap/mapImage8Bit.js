import pixelBppCustomMapper from './pixelBppMapper';

export default function mapImage8Bit({ image, pxData, getPxPos, bpp, data, rawPos }) {
  const imageWidth = image.width;
  const imageHeight = image.height;
  let imagePass = image.index;
  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      let pxPos = getPxPos(x, y, imagePass);

      pixelBppCustomMapper[bpp](pxData, data, pxPos, rawPos);
      rawPos += bpp; //eslint-disable-line no-param-reassign
    }
  }
  return rawPos;
}
