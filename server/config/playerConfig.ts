// player in game properties
export const playerConfig = {
    direction : {
        left: 'left',
        right: 'right'
    },
    groundspeed: 5,
    airspeed: 5,
    jumpheight: 10,
    state: 'idle',
    flipX: false
}

// list mapping to track player state 
export const playerStateMap = {
    clientinput: 'client input',
    playerprop: 'player property'
}