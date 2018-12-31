// @flow
import PNG from './png';

export default (src: PNG) => {
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
};
