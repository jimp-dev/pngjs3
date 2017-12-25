const clr2prop = (clr, minValue, maxValue) =>
  Math.max(
    minValue,
    Math.min(
      maxValue,
      (clr - minValue) / maxValue
    )
  );

export const color = (indata, shrinkMax, shrinkMin, { depth, width, height }) => {
  let maxValue = Math.pow(2, depth) - 1;
  let minValue = 0;

  if (shrinkMin) {
    minValue = indata.reduce((prev, clr, i) => {
      // Alpha channel
      if ((i + 1) % 4 === 0) {
        return prev;
      }
      if (clr < prev) {
        return clr;
      }
      return prev;
    }, maxValue);
  }

  if (shrinkMax) {
    maxValue = indata.reduce((prev, clr, i) => {
      // Alpha channel
      if ((i + 1) % 4 === 0) {
        return prev;
      }
      if (clr > prev) {
        return clr;
      }
      return prev;
    }, -1);
  }

  const outData = new Float32Array(width * height * 3);
  for (let i = 0; i < indata.length / 4; i += 1) {
    const inPos = i * 4;
    const outPos = i * 3;
    for (let clrIndex = 0; clrIndex < 3; clrIndex += 1) {
      outData[outPos + clrIndex] = clr2prop(indata[inPos + clrIndex], minValue, maxValue);
    }
  }
  return outData;
};

export const grayscale = (indata, shrinkMax, shrinkMin, { depth }) => {
  let maxValue = Math.pow(2, depth) - 1;
  let minValue = 0;

  if (shrinkMin) {
    minValue = indata.reduce((prev, clr) => {
      if (clr < prev) {
        return clr;
      }
      return prev;
    }, maxValue);
  }

  if (shrinkMax) {
    maxValue = indata.reduce((prev, clr) => {
      if (clr > prev) {
        return clr;
      }
      return prev;
    }, -1);
  }

  const outData = new Float32Array(indata.length);
  for (let i = 0; i < indata.length; i += 1) {
    outData[i] = clr2prop(indata[i], minValue, maxValue);
  }
  return outData;
};
