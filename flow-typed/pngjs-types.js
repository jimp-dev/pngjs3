//  @flow

declare type Metadata = {|
  width: number,
  height: number,
  depth: 1 | 2 | 4 | 8 | 16,
  interlace: boolean,
  palette: boolean,
  color: boolean,
  alpha: boolean,
  bpp: 1 | 2 | 3 | 4,
  colorType: 0 | 2 | 3 | 4 | 6,
|}
