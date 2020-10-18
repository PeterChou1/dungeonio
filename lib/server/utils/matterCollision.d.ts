import Phaser from "phaser";
export default class MatterCollisionPlugin extends Phaser.Plugins.ScenePlugin {
    events: Phaser.Events.EventEmitter;
    collisionStartListeners: any;
    collisionEndListeners: any;
    collisionActiveListeners: any;
    onCollisionStart: any;
    onCollisionEnd: any;
    onCollisionActive: any;
    /**
     * Creates an instance of MatterCollisionPlugin.
     * @param {Phaser.Scene} scene
     * @param {Phaser.Plugins.PluginManager} pluginManager
     */
    constructor(scene: any, pluginManager: any);
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
    addOnCollideStart({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): any;
    /**
     * This method mirrors {@link MatterCollisionPlugin#addOnCollideStart}
     * @param {object} options
     */
    addOnCollideEnd({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): any;
    /**
     * This method mirrors {@link MatterCollisionPlugin#addOnCollideStart}
     * @param {object} options
     */
    addOnCollideActive({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): any;
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
    removeOnCollideStart({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): void;
    /**
     * This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart}
     * @param {object} options
     */
    removeOnCollideEnd({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): void;
    /**
     * This method mirrors {@link MatterCollisionPlugin#removeOnCollideStart}
     * @param {object} options
     */
    removeOnCollideActive({ objectA, objectB, callback, context }?: {
        objectA: any;
        objectB: any;
        callback: any;
        context: any;
    }): void;
    /**
     * Remove any listeners that were added with addOnCollideStart.
     */
    removeAllCollideStartListeners(): void;
    /**
     * Remove any listeners that were added with addOnCollideActive.
     */
    removeAllCollideActiveListeners(): void;
    /**
     * Remove any listeners that were added with addOnCollideEnd.
     */
    removeAllCollideEndListeners(): void;
    /**
     * Remove any listeners that were added with addOnCollideStart, addOnCollideActive or
     * addOnCollideEnd.
     */
    removeAllCollideListeners(): void;
    /** @private */
    addOnCollide(map: any, objectA: any, objectB: any, callback: any, context: any): void;
    /** @private */
    removeOnCollide(map: any, objectA: any, objectB: any, callback: any, context: any): void;
    /** @private */
    addOnCollideObjectVsObject(map: any, objectA: any, objectB: any, callback: any, context: any): void;
    /**
     * Reusable handler for collisionstart, collisionend, collisionactive.
     * @private
     * */
    onCollisionEvent(listenerMap: any, eventName: any, event: any): void;
    /** @private */
    checkPairAndEmit(map: any, objectA: any, bodyB: any, gameObjectB: any, eventData: any): void;
    subscribeMatterEvents(): void;
    unsubscribeMatterEvents(): void;
    boot(): void;
    shutdown(): void;
    destroy(): void;
}
