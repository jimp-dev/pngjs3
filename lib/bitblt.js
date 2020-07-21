// @flow
import { type PNGInterface } from './types';

type Props = {|
  src: PNGInterface,
  dst: PNGInterface,
  srcX?: number | void,
  srcY?: number | void,
  width?: number | void,
  height?: number | void,
  deltaX?: number | void,
  deltaY?: number | void,
|};

export default (props: Props) => {
  const { src, dst, srcX = 0, srcY = 0, width = 0, height = 0, deltaX = 0, deltaY = 0 } = props;
  // coerce pixel dimensions to integers (also coerces undefined -> 0):

  if (
    srcX > src.width ||
    srcY > src.height ||
    srcX + width > src.width ||
    srcY + height > src.height
  ) {
    throw new Error('bitblt reading outside image');
  }

  if (
    deltaX > dst.width ||
    deltaY > dst.height ||
    deltaX + width > dst.width ||
    deltaY + height > dst.height
  ) {
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
    data.copy(
      outData,
      ((deltaY + y) * dst.width + deltaX) << 2,
      ((srcY + y) * src.width + srcX) << 2,
      ((srcY + y) * src.width + srcX + width) << 2,
    );
  }
};
