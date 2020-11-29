export const playerConfig = {
    direction : {
        left: 'left',
        right: 'right'
    },
    groundspeed: 5,
    airspeed: 5,
    jumpheight: 10,
}


export const playerAnims = [
    {
        key: 'run',
        frames: ['mainchar', { end: 5, prefix: 'adventurer-run-', zeroPad: 2}],
        frameRate: 10,
        repeat: -1,
    },
    {
        key: 'idle',
        frames: ['mainchar', { end: 2, prefix:'adventurer-idle-', zeroPad: 2}],
        frameRate: 10,
        repeat: -1
    },
    {
        key: 'jump',
        frames: ['mainchar', { end: 3, prefix: 'adventurer-jump-', zeroPad: 2}],
        frameRate: 10
    },
    {
        key:'fall',
        frames: ['mainchar', { end: 1, prefix: 'adventurer-fall-', zeroPad: 2}],
        frameRate: 10,
        repeat: -1,
    },
    {
        key: 'attack1',
        frames: ['mainchar', { end: 4, prefix: 'adventurer-attack1-', zeroPad: 2}],
        frameRate: 10,
        repeat: 0
    },
    {
        key: 'idleOnce',
        frames: ['mainchar', { end: 2, prefix:'adventurer-idle-', zeroPad: 2}],
        frameRate: 10,
        repeat: 0
    }
]