export abstract class gameObject {
  id;
  abstract setVelocity(...args);
  abstract setVelocityX(...args);
  abstract setVelocityY(...args);
  abstract setCollidesWith(...args);
  abstract getPosition(...args);
  abstract getState(...args);
  abstract getMeta(...args);
}
