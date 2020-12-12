export declare const serverport = 4000;
export declare const gameConfig: {
  debug: boolean;
  networkdebug: boolean;
  simulatelatency: boolean;
  size: {
    width: number;
    height: number;
  };
  debugsize: {
    width: number;
    height: number;
  };
};
export declare const collisionData: {
  category: {
    hard: number;
    soft: number;
    player: number;
    noplayer: number;
  };
  group: {
    player: number;
    noplayer: number;
  };
};
export declare const messageType: {
  move: number;
  playerinput: number;
  aoiadd: number;
  aoiupdate: number;
  aoiremove: number;
};
