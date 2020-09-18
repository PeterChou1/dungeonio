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
        frames: ['player', {start: 8, end: 13}],
        frameRate: 10,
        repeat: -1,
    },
    {
        key: 'idle',
        frames: ['player', {start: 0, end: 3 }],
        frameRate: 10,
        repeat: -1
    },
    {
        key: 'jump',
        frames: ['player', {start: 14, end: 18}],
        frameRate: 10
    },
    {
        key:'fall',
        frames: ['player', {start: 22, end: 23 }],
        frameRate: 10,
        repeat: -1,
    },
    {
        key: 'landing',
        frames: ['player', {start: 4, end: 7}],
        frameRate: 10
    }
]