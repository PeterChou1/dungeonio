export const serverport = 4000;

export const gameConfig = {
  debug: false, // enable debug graphics
  networkdebug: false, // inject server instance into client side
  simulatelatency: false, // simulate latency for testing client side prediction
  size: {
    width: 1024,
    height: 768,
  },
  debugsize: {
    width: 800,
    height: 600,
  },
};

/**
 * @description maps category id to class
 */
export const entityCategory = {};

// collision detection
export const collisionData = {
  //NOTE: category number must be powers of 2 between [1, 2^31]
  category: {
    hard: 2 ** 0, // hard platform
    soft: 2 ** 1, // soft platform
    player: 2 ** 2, // player category
  },
};

export const messageType = {
  playerinput: 0,
  playersleep: 1, // when player navigates away from tab
  playerawake: 2, // when user navigates back to tab
  aoiadd: 3, // add gameobject to aoi
  aoiupdate: 4, // update gameobject in player area of interest
  aoiremove: 5, // remove gameobject in player area of interest
  kill: 6,
};

export const frontEndEvent = {
  uiupdate: 0, // updates which effect HUD scene
};
