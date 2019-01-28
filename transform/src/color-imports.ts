/* Import some modules because typescript wont recognize my ambient declarations */

// @ts-ignore
import space_ from 'color-space';
// @ts-ignore
import DeltaE_ from 'delta-e';

/*====*/
type ArrayColor = [number, number, number];
type Spaces = 'xyz' | 'rgb' | 'lab';
type ColorConvert = (a: ArrayColor) => ArrayColor;
type Converter = {
  [k in Spaces]: ColorConvert;
};

export const colorSpace = <{
  xyz: Converter;
  rgb: Converter;
}><unknown>space_;
/*====*/

interface ILabColor {
  L: number;
  A: number;
  B: number;
}

type GetDelta = (a: ILabColor, b: ILabColor) => number;

interface IDeltaE {
  getDeltaE76: GetDelta;
  getDeltaE94: GetDelta;
  getDeltaE00: GetDelta;
}

export const DeltaE = <IDeltaE><unknown>DeltaE_;
/*====*/
