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
    width: 512,
    height: 384,
  },
};

// collision detection
export const collisionData = {
  category: {
    hard: 0x0001, // hard platform
    soft: 0x0002, // soft platform
    player: 0x0003, // player category
    noplayer: 0x0004, // cannot collide with player category
  },
  group: {
    player: 1, // any object with group id 1 can interact with the player
    noplayer: 2, // any object with group id 2 can not interact with player
  },
};

export const messageType = {
  move: 0, // message for player movement
  playerinput: 1,
  aoiadd: 2, // add gameobject to aoi
  aoiupdate: 3, // update gameobject in player area of interest
  aoiremove: 4, // remove gameobject in player area of interest
};
