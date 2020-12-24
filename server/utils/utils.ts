interface Action {
  callback: (...args) => any | void;
  args: Array<any>;
}
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;

export class ActionQueue {
  items: Array<Action>;

  constructor() {
    this.items = [];
  }

  isEmpty() {
    // return true if the queue is empty.
    return this.items.length == 0;
  }

  enqueue(element: Action) {
    // adding element to the queue
    this.items.push(element);
  }

  dequeue(): Action {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  executeActions() {
    //console.log('executing actions');
    while (!this.isEmpty()) {
      const { callback, args } = this.dequeue();
      console.log("execute action with args ", args);
      //console.log('with context ', context)
      callback(...args);
    }
  }
}

export function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const createanims = (scene, anims) => {
  // deep clone anims to prevent mutation if
  // if you do not include this it will mutate the object so if a user joins again
  // the game will crash
  const frameNames = [];
  const anims_copy = JSON.parse(JSON.stringify(anims));
  anims_copy.forEach((anim) => {
    anim.frames = scene.anims.generateFrameNames(...anim.frames);
    for (const frame of anim.frames) {
      frameNames.push(frame.frame);
    }
    scene.anims.create(anim);
  });

  return frameNames;
};

export const createFrameNames = (animsManager, anims) => {
  const copy = JSON.parse(JSON.stringify(anims));
  const frameNames = [];
  for (const anim of copy) {
    console.log(anim.frames);
    console.log(animsManager.generateFrameNames);
    console.log(animsManager.generateFrameNames(...anim.frames));
    frameNames.push(animsManager.generateFrameNames(...anim.frames));
  }
  return frameNames;
};
