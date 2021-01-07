type hitboxdata = {
  [propName: string]: {
    label: string; // which body parts connect to which hitbox
    knockback: { x: number; y: number };
    hitstun: number;
    damage: number;
  };
};
/**
 * @description describes hitbox data
 */
export const playerHitboxData: hitboxdata = {
  "adventurer-air-attack1-01": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-air-attack2-00": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-air-attack3-loop-00": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-air-attack3-loop-01": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-air-attack-3-end-00": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-attack1-02": {
    label: "hitbox",
    knockback: { x: -3, y: 0 },
    damage: 5,
    hitstun: 200,
  },
  "adventurer-attack2-03": {
    label: "hitbox",
    knockback: { x: 0, y: 0 },
    damage: 5,
    hitstun: 100,
  },
  "adventurer-attack3-02": {
    label: "hitbox",
    knockback: { x: 5, y: -3 },
    damage: 5,
    hitstun: 100,
  },
  "adventurer-slide-00": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 2,
    hitstun: 100,
  },
  "adventurer-slide-01": {
    label: "hitbox",
    knockback: { x: 5, y: -5 },
    damage: 5,
    hitstun: 100,
  },
};

export const playerConfig = {
  dim: {
    h: 70,
    w: 37,
  },
  groundspeed: 5,
  airspeed: 5,
  jumpheight: 10,
};

/**
 * @deprecated
 * */
export const playerStateMap = {
  clientinput: "client input",
  playerprop: "player property",
};

export const gameEvents = {
  // animation event
  anims: {
    framechange: "framechange",
    animationcomplete: "animationcomplete",
    animationrepeat: "animationrepeat",
  },
  // stateMachine events
  stateMachine: {
    enter: "enter",
    dispatchcomplete: "dispatchcomplete",
  },
  // body events
  body: {
    statechange: "statechange",
  },
  player: {
    dead: "dead",
  },
};

type anims = {
  key: string;
  frames: [
    string,
    { end: number; prefix: string; zeroPad: number; start?: number }
  ];
  frameRate: number;
  repeat: number;
};
/**
 * @description default stat
 */
export const defaultStats = {
  
}
/**
 * @description cost of each active player action
 */
export const staminaCost = {
  // inital cost of going into run state
  runinit: 20,
  run: 1,
  standroll: 10,
  walkroll: 20,
  runroll: 30,
  airattack1: 30,
  dashattack: 20,
  attack1: 20,
  attack2: 20,
  attack3: 20,
};

/**
 * @description Defines animation player has
 * NOTE: duration frames * 1000 ms / frameRate
 * example: jump = 4 * 1000 / 10 = 400ms
 * Also used to create animation client side
 */
export const playerAnims: Array<anims> = [
  {
    key: "walk",
    frames: ["mainchar", { end: 5, prefix: "adventurer-run-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "run",
    frames: ["mainchar", { end: 5, prefix: "adventurer-run-", zeroPad: 2 }],
    frameRate: 20,
    repeat: -1,
  },
  {
    key: "idle",
    frames: ["mainchar", { end: 3, prefix: "adventurer-idle-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "jump",
    frames: ["mainchar", { end: 3, prefix: "adventurer-jump-", zeroPad: 2 }],
    frameRate: 25,
    repeat: 0,
  },
  {
    key: "fall",
    frames: ["mainchar", { end: 1, prefix: "adventurer-fall-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "attack1",
    frames: ["mainchar", { end: 4, prefix: "adventurer-attack1-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "attack2",
    frames: ["mainchar", { end: 5, prefix: "adventurer-attack2-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "attack3",
    frames: ["mainchar", { end: 5, prefix: "adventurer-attack3-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "airattack1",
    frames: [
      "mainchar",
      { end: 3, prefix: "adventurer-air-attack1-", zeroPad: 2 },
    ],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "dashattack",
    frames: ["mainchar", { end: 1, prefix: "adventurer-slide-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "hurt",
    frames: ["mainchar", { end: 2, prefix: "adventurer-hurt-", zeroPad: 2 }],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "hitstun",
    frames: [
      "mainchar",
      { start: 2, end: 2, prefix: "adventurer-hurt-", zeroPad: 2 },
    ],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "death",
    frames: [
      "mainchar",
      { start: 0, end: 6, prefix: "adventurer-die-", zeroPad: 2 },
    ],
    frameRate: 10,
    repeat: 0,
  },
  {
    key: "dead",
    frames: [
      "mainchar",
      { start: 6, end: 6, prefix: "adventurer-die-", zeroPad: 2 },
    ],
    frameRate: 10,
    repeat: -1,
  },
  {
    key: "smrslt",
    frames: ["mainchar", { end: 4, prefix: "adventurer-smrslt-", zeroPad: 2 }],
    frameRate: 10,
    repeat: -1,
  },
];
