export const serverport = 4000;

export const gameConfig = {
    debug: true
}

// collision
export const collisionData = {
    category : {
        hard : 0x0001, // hard platform
        soft : 0x0002, // soft platform
    }, 
    group : {
        player: 1 // any object with group id 1 can interact with the player
    }
}


export const messageType = {
    move : 0, // message for player movement
    playerinput: 1
}