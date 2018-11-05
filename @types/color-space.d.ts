type ArrayColor = [number, number, number];
type Spaces = 'xyz' | 'rgb' | 'lab';
interface ColorConvert {
  (a: ArrayColor): ArrayColor;
}
type Converter = {
  [k in Spaces]: ColorConvert;
}

declare module 'color-space/rgb' {
  declare const rgb: Converter;
  export = rgb;
}

declare module 'color-space/xyz' {
  declare const xyz: Converter;
  export = xyz;
}

declare module 'color-space/lab' {
  declare const lab: Converter;
  export = lab;
}