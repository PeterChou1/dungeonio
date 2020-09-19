import Phaser from "phaser";
const logger = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

function getRootBody(body) {
    while (body.parent !== body) body = body.parent;
    return body;
}
  
/**
 * Duck type to check if the given object is a Matter body (because there isn't a prototype)
 * @private
 */
function isMatterBody(obj) {
    return (
        obj.hasOwnProperty("collisionFilter") &&
        obj.hasOwnProperty("parts") &&
        obj.hasOwnProperty("slop")
    );
}
  
/**
 * Check if object is an acceptable physical object for this plugin - a Matter Body, a tile, or an
 * object with a body property
 * @private
 */
function isPhysicsObject(obj) {
    return isMatterBody(obj) || obj.body || obj instanceof Phaser.Tilemaps.Tile;
}
  
/** @private */
function warnInvalidObject(obj) {
    logger.warn(
        `Expected a Matter body, Tile or an object with a body property, but instead, recieved: ${obj}`
    );
}
export default class MatterCollisionPlugin extends Phaser.Plugins.ScenePlugin {

    events : Phaser.Events.EventEmitter;
    collisionStartListeners;
    collisionEndListeners;
    collisionActiveListeners;
    onCollisionStart;
    onCollisionEnd;
    onCollisionActive;
    /**
     * Creates an instance of MatterCollisionPlugin.
     * @param {Phaser.Scene} scene
     * @param {Phaser.Plugins.PluginManager} pluginManager
     */
    constructor(scene, pluginManager) {
      super(scene, pluginManager);
      console.log('matter collision plugin installed');
      this.scene = scene;
  
      /**
       * @type {Phaser.Events.EventEmitter}
       * @emits {collisionstart}
       * @emits {collisionactive}
       * @emits {collisionend}
       * @emits {paircollisionstart}
       * @emits {paircollisionactive}
       * @emits {paircollisionend}
       */
      this.events = new Phaser.Events.EventEmitter();
  
      // Maps from objectA => {target?, callback, context?}
      /** @private */
      this.collisionStartListeners = new Map();
      /** @private */
      this.collisionEndListeners = new Map();
      /** @private */
      this.collisionActiveListeners = new Map();
      /**
       * @fires collisionstart
       * @fires paircollisionstart
       * @private
       */
      this.onCollisionStart = this.onCollisionEvent.bind(
        this,
        this.collisionStartListeners,
        "collisionstart"
      );
  
      /**
       * @fires collisionend
       * @fires paircollisionend
       * @private
       */
      this.onCollisionEnd = this.onCollisionEvent.bind(
        this,
        this.collisionEndListeners,
        "collisionend"
      );
  
      /**
       * @fires collisionactive
       * @fires paircollisionactive
       * @private
       */
      this.onCollisionActive = this.onCollisionEvent.bind(
        this,
        this.collisionActiveListeners,
        "collisionactive"
      );
  
      this.scene.events.once("start", this.start, this);
      this.scene.events.once("destroy", this.destroy, this);
    }
  
    /**
     * Add a listener for collidestart events between objectA and objectB. The collidestart event is
     * fired by Matter when two bodies start colliding within a tick of the engine. If objectB is
     * omitted, any collisions with objectA will be passed along to the listener. See
     * {@link paircollisionstart} for information on callback parameters.
     *
     * @param {object} options
     * @param {PhysicsObject|ObjectWithBody} options.objectA - The first object to watch for in
     * colliding pairs.
     * @param {PhysicsObject|ObjectWithBody} [options.objectB] - Optional, the second object to watch
     * for in colliding pairs. If not defined, all collisions with objectA will trigger the callback
     * @param {function} options.callback - The function to be invoked on collision
     * @param {any} [options.context] - The context to apply when invoking the callback.
     * @returns {function} A function that can be invoked to unsubscribe the listener that was just
     * added.
     */
    //@ts-ignore
    addOnCollideStart({ objectA, objectB, callback, context } = {}) {
      console.log('added on collide start');
      this.addOnCollide(this.collisionStartListeners, objectA, objectB, callback, context);
      return this.removeOnCollideStart.bind(this, { objectA, objectB, callback, context });
    }
  
    /**
     * This method mirrors {@link MatterCollisionPlugin#addOnCollideStart}
     * @param {object} options
     */
    //@ts-ignore
    addOnCollideEnd({ objectA, objectB, callback, context } = {}) {
      this.addOnCollide(this.collisionEndListeners, objectA, objectB, callback, context);
      return this.removeOnCollideEnd.bind(this, { objectA, objectB, callback, context });
    }
  
    /**
     * This method mirrors {@link MatterCollisionPlugin#addOnCollideStart}
     * @param {object} options
     */
    //@ts-ignore
    addOnCollideActive({ objectA, objectB, callback, context } = {}) {
      this.addOnCollide(this.collisionActiveListeners, objectA, objectB, callback, context);
      return this.removeOnCollideActive.bind(this, { objectA, objectB, callback, context });
    }
  
    /**
     * Remove any listeners that were added with addOnCollideStart. If objectB, callback or context
     * parameters are omitted, any listener matching the remaining parameters will be removed. E.g. if
     * you only specify objectA and objectB, all listeners with objectA & objectB will be removed
     * regardless of the callback or context.
     *
     * @param {object} options
     * @param {PhysicsObject|ObjectWithBody} options.objectA - The first object to watch for in
     * colliding pairs.
     * @param {PhysicsObject|ObjectWithBody} [options.objectB] - the second object to watch for in
     * colliding pairs.
     * @param {function} [options.callback] - The function to be invoked on collision
     * @param {any} [options.context] - The context to apply when invoking the callback.
     */
    //@ts-ignore
    removeOnCollideStart({ objectA, objectB, callback, context } = {}) {
      this.removeOnCollide(this.collisionStartListeners, objectA, objectB, callback, context);
    }
  
    /**
     * This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart}
     * @param {object} options
     */
    //@ts-ignore
    removeOnCollideEnd({ objectA, objectB, callback, context } = {}) {
      this.removeOnCollide(this.collisionEndListeners, objectA, objectB, callback, context);
    }
  
    /**
     * This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart}
     * @param {object} options
     */
    //@ts-ignore
    removeOnCollideActive({ objectA, objectB, callback, context } = {}) {
      this.removeOnCollide(this.collisionActiveListeners, objectA, objectB, callback, context);
    }
  
    /**
     * Remove any listeners that were added with addOnCollideStart.
     */
    removeAllCollideStartListeners() {
      this.collisionStartListeners.clear();
    }
    /**
     * Remove any listeners that were added with addOnCollideActive.
     */
    removeAllCollideActiveListeners() {
      this.collisionActiveListeners.clear();
    }
    /**
     * Remove any listeners that were added with addOnCollideEnd.
     */
    removeAllCollideEndListeners() {
      this.collisionEndListeners.clear();
    }
    /**
     * Remove any listeners that were added with addOnCollideStart, addOnCollideActive or
     * addOnCollideEnd.
     */
    removeAllCollideListeners() {
      this.removeAllCollideStartListeners();
      this.removeAllCollideActiveListeners();
      this.removeAllCollideEndListeners();
    }
  
    /** @private */
    addOnCollide(map, objectA, objectB, callback, context) {
      if (!callback || typeof callback !== "function") {
        logger.warn(`No valid callback specified. Received: ${callback}`);
        return;
      }
      const objectsA = Array.isArray(objectA) ? objectA : [objectA];
      const objectsB = Array.isArray(objectB) ? objectB : [objectB];
      objectsA.forEach(a => {
        objectsB.forEach(b => {
          this.addOnCollideObjectVsObject(map, a, b, callback, context);
        });
      });
    }
  
    /** @private */
    removeOnCollide(map, objectA, objectB, callback, context) {
      const objectsA = Array.isArray(objectA) ? objectA : [objectA];
      const objectsB = Array.isArray(objectB) ? objectB : [objectB];
      objectsA.forEach(a => {
        if (!objectB) {
          map.delete(a);
        } else {
          const callbacks = map.get(a) || [];
          const remainingCallbacks = callbacks.filter(
            cb =>
              !(
                objectsB.includes(cb.target) &&
                (!callback || cb.callback === callback) &&
                (!context || cb.context === context)
              )
          );
          if (remainingCallbacks.length > 0) map.set(a, remainingCallbacks);
          else map.delete(a);
        }
      });
    }
  
    /** @private */
    addOnCollideObjectVsObject(map, objectA, objectB, callback, context) {
      // Can't do anything if the first object is not defined or invalid
      if (!objectA || !isPhysicsObject(objectA)) {
        warnInvalidObject(objectA);
        return;
      }
  
      // The second object can be undefined or a valid body
      if (objectB && !isPhysicsObject(objectB)) {
        warnInvalidObject(objectA);
        return;
      }
  
      const callbacks = map.get(objectA) || [];
      callbacks.push({ target: objectB, callback, context });
      map.set(objectA, callbacks);
    }
  
    /**
     * Reusable handler for collisionstart, collisionend, collisionactive.
     * @private
     * */
    onCollisionEvent(listenerMap, eventName, event) {
      const pairs = event.pairs;
      const pairEventName = "pair" + eventName;
      const eventData = {};
      const eventDataReversed = { isReversed: true };
  
      pairs.map((pair, i) => {
        const { bodyA, bodyB } = pair;
  
        let gameObjectA = getRootBody(bodyA).gameObject;
        let gameObjectB = getRootBody(bodyB).gameObject;
  
        // Special case for tiles, where it's more useful to have a reference to the Tile object not
        // the TileBody. This is hot code, so use a property check instead of instanceof.
        if (gameObjectA && gameObjectA.tile) gameObjectA = gameObjectA.tile;
        if (gameObjectB && gameObjectB.tile) gameObjectB = gameObjectB.tile;
  
        pairs[i].gameObjectA = gameObjectA;
        pairs[i].gameObjectB = gameObjectB;
        //@ts-ignore
        eventData.bodyA = bodyA;
        //@ts-ignore
        eventData.bodyB = bodyB;
        //@ts-ignore
        eventData.gameObjectA = gameObjectA;
        //@ts-ignore
        eventData.gameObjectB = gameObjectB;
        //@ts-ignore
        eventData.pair = pair;
  
        this.events.emit(pairEventName, eventData);
  
        if (listenerMap.size) {
          //@ts-ignore
          eventDataReversed.bodyB = bodyA;
          //@ts-ignore
          eventDataReversed.bodyA = bodyB;
          //@ts-ignore
          eventDataReversed.gameObjectB = gameObjectA;
          //@ts-ignore
          eventDataReversed.gameObjectA = gameObjectB;
          //@ts-ignore
          eventDataReversed.pair = pair;
  
          this.checkPairAndEmit(listenerMap, bodyA, bodyB, gameObjectB, eventData);
          this.checkPairAndEmit(listenerMap, bodyB, bodyA, gameObjectA, eventDataReversed);
  
          if (gameObjectA) {
            this.checkPairAndEmit(listenerMap, gameObjectA, bodyB, gameObjectB, eventData);
          }
          if (gameObjectB) {
            this.checkPairAndEmit(listenerMap, gameObjectB, bodyA, gameObjectA, eventDataReversed);
          }
        }
      });
  
      this.events.emit(eventName, event);
    }
  
    /** @private */
    checkPairAndEmit(map, objectA, bodyB, gameObjectB, eventData) {
      const callbacks = map.get(objectA);
      if (callbacks) {
        callbacks.forEach(({ target, callback, context }) => {
          if (!target || target === bodyB || target === gameObjectB) {
            callback.call(context, eventData);
          }
        });
      }
    }
  
    subscribeMatterEvents() {
      const matter = this.scene.matter;
      if (!matter || !matter.world) {
        logger.warn("Plugin requires matter!");
        return;
      }
      console.log('subscribed matter event');
      matter.world.on("collisionstart", this.onCollisionStart);
      matter.world.on('collisionstart', () => {console.log('something collided')});
      matter.world.on("collisionactive", this.onCollisionActive);
      matter.world.on("collisionend", this.onCollisionEnd);
    }
  
    unsubscribeMatterEvents() {
      // Don't unsub if matter next existing or if the game is destroyed (since the matter world will
      // be already gone)
      const matter = this.scene.matter;
      if (!matter || !matter.world) return;
      matter.world.off("collisionstart", this.onCollisionStart);
      matter.world.off("collisionactive", this.onCollisionActive);
      matter.world.off("collisionend", this.onCollisionEnd);
    }
  
    boot() {
      // If restarting, unsubscribe before resubscribing to ensure only one listener is added
      this.scene.events.off("shutdown", this.shutdown, this);
      this.scene.events.on("shutdown", this.shutdown, this);
      this.subscribeMatterEvents();
    }
  
    shutdown() {
      this.removeAllCollideListeners();
      this.unsubscribeMatterEvents();
      // Resubscribe to start so that the plugin is started again after Matter
      this.scene.events.once("start", this.start, this);
    }
  
    destroy() {
      this.scene.events.off("start", this.start, this);
      this.scene.events.off("shutdown", this.shutdown, this);
      this.removeAllCollideListeners();
      this.unsubscribeMatterEvents();
      this.scene = undefined;
    }
  }