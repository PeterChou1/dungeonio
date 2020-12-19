export declare const playerStateMap: {
  clientinput: string;
  playerprop: string;
};
export declare const playerAnims: (
  | {
      key: string;
      frames: (
        | string
        | {
            end: number;
            prefix: string;
            zeroPad: number;
          }
      )[];
      frameRate: number;
      repeat: number;
    }
  | {
      key: string;
      frames: (
        | string
        | {
            end: number;
            prefix: string;
            zeroPad: number;
          }
      )[];
      frameRate: number;
      repeat?: undefined;
    }
)[];
