// @flow
const clr2prop = (clr, minValue, maxValue) => Math.min(1, Math.max(0, (clr - minValue) / maxValue));

type ImgProps = {
  depth: number,
  width: number,
  height: number,
};
export const color = (indata: Buffer | Uint8Array | Uint16Array, shrinkMax: boolean, shrinkMin: boolean, { depth, width, height }: ImgProps): Float32Array => {
  let maxValue = Math.pow(2, depth) - 1;
  let minValue = 0;

  if (shrinkMin) {
    minValue = maxValue;
    for (let i = 0; i < indata.length; i += 1) {
      // Alpha channel
      if ((i + 1) % 4 !== 0) {
        const clr = indata[i];
        if (minValue > clr) {
          minValue = clr;
          if (minValue === 0) {
            break;
          }
        }
      }
    }
  }

  if (shrinkMax) {
    let newMaxValue = -1;
    for (let i = 0; i < indata.length; i += 1) {
      // Alpha channel
      if ((i + 1) % 4 !== 0) {
        const clr = indata[i];
        if (newMaxValue < clr) {
          newMaxValue = clr;
          if (newMaxValue === maxValue) {
            break;
          }
        }
      }
    }
    maxValue = newMaxValue;
  }

  const outData = new Float32Array(width * height * 3);
  for (let i = 0; i < indata.length / 4; i += 1) {
    const inPos = i << 2; // Same as * 4
    const outPos = i * 3;

    outData[outPos] = clr2prop(indata[inPos], minValue, maxValue);
    outData[outPos + 1] = clr2prop(indata[inPos + 1], minValue, maxValue);
    outData[outPos + 2] = clr2prop(indata[inPos + 2], minValue, maxValue);
  }
  return outData;
};

export const grayscale = (indata: Buffer | Uint8Array | Uint16Array, shrinkMax: boolean, shrinkMin: boolean, { depth }: { depth: number }): Float32Array => {
  let maxValue = Math.pow(2, depth) - 1;
  let minValue = 0;

  if (shrinkMin) {
    minValue = maxValue;
    for (let i = 0; i < indata.length; i += 1) {
      const clr = indata[i];
      if (minValue > clr) {
        minValue = clr;
        if (minValue === 0) {
          break;
        }
      }
    }
  }

  if (shrinkMax) {
    let newMaxValue = -1;
    for (let i = 0; i < indata.length; i += 1) {
      const clr = indata[i];
      if (newMaxValue < clr) {
        newMaxValue = clr;
        if (newMaxValue === maxValue) {
          break;
        }
      }
    }
    maxValue = newMaxValue;
  }

  const outData = new Float32Array(indata.length);
  for (let i = 0; i < indata.length; i += 1) {
    outData[i] = clr2prop(indata[i], minValue, maxValue);
  }
  return outData;
};
