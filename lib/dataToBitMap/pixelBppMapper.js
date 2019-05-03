export default [
  // 0 - dummy entry
  () => {},

  // 1 - L
  // 0: 0, 1: 0, 2: 0, 3: 0xff
  (pxData, data, pxPos, rawPos) => {
    if (rawPos === data.length) {
      throw new Error('Ran out of data');
    }

    var pixel = data[rawPos];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = 0xff;
  },

  // 2 - LA
  // 0: 0, 1: 0, 2: 0, 3: 1
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 1 >= data.length) {
      throw new Error('Ran out of data');
    }

    var pixel = data[rawPos];
    pxData[pxPos] = pixel;
    pxData[pxPos + 1] = pixel;
    pxData[pxPos + 2] = pixel;
    pxData[pxPos + 3] = data[rawPos + 1];
  },

  // 3 - RGB
  // 0: 0, 1: 1, 2: 2, 3: 0xff
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 2 >= data.length) {
      throw new Error('Ran out of data');
    }

    pxData[pxPos] = data[rawPos];
    pxData[pxPos + 1] = data[rawPos + 1];
    pxData[pxPos + 2] = data[rawPos + 2];
    pxData[pxPos + 3] = 0xff;
  },

  // 4 - RGBA
  // 0: 0, 1: 1, 2: 2, 3: 3
  (pxData, data, pxPos, rawPos) => {
    if (rawPos + 3 >= data.length) {
      throw new Error('Ran out of data');
    }

    pxData[pxPos] = data[rawPos];
    pxData[pxPos + 1] = data[rawPos + 1];
    pxData[pxPos + 2] = data[rawPos + 2];
    pxData[pxPos + 3] = data[rawPos + 3];
  },
];
