declare module 'delta-e' {
  interface LabColor {
    L: number;
    A: number;
    B: number;
  }

  interface GetDelta {
    (a: LabColor, b: LabColor): number;
  } 

  interface TDeltaE {
    getDeltaE76: GetDelta;
    getDeltaE94: GetDelta;
    getDeltaE00: GetDelta;
  }

  declare const DeltaE: TDeltaE;

  export = DeltaE;
}