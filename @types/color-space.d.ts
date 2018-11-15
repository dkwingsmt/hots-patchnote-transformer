type ArrayColor = [number, number, number];
type Spaces = 'xyz' | 'rgb' | 'lab';
interface ColorConvert {
  (a: ArrayColor): ArrayColor;
}
type Converter = {
  [k in Spaces]: ColorConvert;
}

declare module 'color-space' {
  declare const space: {
    xyz: Converter;
    rgb: Converter;
  };
  export = space;
}