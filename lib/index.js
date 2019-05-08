// @flow
import * as _sync from './png-sync';
import * as _PNG from './png';

export default _PNG.default;
export const PNG = _PNG.default;
export { default as adjustGamma } from './adjustGamma';
export { default as bitblt } from './bitblt';

export const sync = _sync;

// Flow types to export
export interface Metadata extends _PNG.Metadata {}
export type Props = _PNG.Props;
export type Store = _PNG.Store;
