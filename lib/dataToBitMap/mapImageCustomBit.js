import pixelBppCustomMapper from './pixelBppCustomMapper';

// Used for non 8 bit images
export default function mapImageCustomBit({
  image, pxData, getPxPos, bpp, bits, maxBit,
}) {
  const {
    width: imageWidth,
    height: imageHeight,
  } = image;
  let imagePass = image.index;
  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      let pixelData = bits.get(bpp);
      let pxPos = getPxPos(x, y, imagePass);
      pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
    }
    bits.resetAfterLine();
  }
}
