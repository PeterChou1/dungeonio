export const serverport = 4000;

export const gameConfig = {
    debug: false, // enable debug graphics
    networkdebug: false, // inject server player instance into client side
    simulatelatency:  false,// simulate latency for testing client side prediction
    size : {
        width: 600,
        height: 800
    }
}

// collision detection
export const collisionData = {
    category : {
        hard : 0x0001, // hard platform
        soft : 0x0002, // soft platform
        player : 0x0003, // player category
        noplayer : 0x0004 // cannot collide with player category

    }, 
    group : {
        player: 1,  // any object with group id 1 can interact with the player
        noplayer: 2 // any object with group id 2 can not interact with player
    }
}


export const messageType = {
    move : 0, // message for player movement
    playerinput: 1
}