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
export const entityCategory = {

}

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
  playerinput: 0,
  playersleep: 1, // when player navigates away from tab
  playerawake: 2, // when user navigates back to tab
  aoiadd: 3, // add gameobject to aoi
  aoiupdate: 4, // update gameobject in player area of interest
  aoiremove: 5, // remove gameobject in player area of interest
  kill: 6
};


export const frontEndEvent = {
  uiupdate : 0 // updates which effect HUD scene
}
