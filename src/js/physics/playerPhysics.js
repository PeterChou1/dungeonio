import Phaser from "phaser";
import {collisionData} from '../config/globalconfig';
const {Body, Bodies} = Phaser.Physics.Matter.Matter;
/*
 Encapsulate all physics behaviour for player
*/
export class PlayerPhysics {

    constructor(scene, sprite, stateMachine, x, y, scale){
        this.scene = scene;
        this.sprite = sprite;
        this.stateMachine = stateMachine;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false};
        this.onPlatform = false;
        const {width : w, height: h} = this.sprite;
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * 2, { chamfer: {radius: 5}});
        this.sprite.setScale(scale);
        this.sensors = {
            nearbottom: Bodies.rectangle(0, h + 25, w, 50, {isSensor: true}),
            bottom: Bodies.rectangle(0, h , w  , 2, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h ,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h , {isSensor: true}), 
            top: Bodies.rectangle(0, -h, w, 2, {isSensor: true}),
            neartop: Bodies.rectangle(0, -h - 25, w, 50, {isSensor: true})
        };
        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        })
        this.sprite
            .setExistingBody(compoundBody)
            .setScale(2)
            .setFixedRotation()
            .setPosition(x, y);

        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
            callback: this.onSensorCollide,
            context: this
        });
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
            callback: this.onSensorCollide,
            context: this
        });
        this.scene.matterCollision.addOnCollideStart({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = true;
                this.sprite.setCollidesWith([collisionData.category.hard, collisionData.category.soft])
            },
            context: this
        })
        this.scene.matterCollision.addOnCollideEnd({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                console.log('platform end collide');
                this.onPlatform = false;
                this.sprite.setCollidesWith([collisionData.category.hard])
            },
            context: this
        })
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
    }


    resetTouching() {
        this.isTouching.left = false;
        this.isTouching.right = false;
        this.isTouching.ground = false;
        this.isTouching.top = false;
        this.isTouching.nearground = false;
    }

    onSensorCollide({ bodyA, bodyB, pair }) {
        if (bodyB.isSensor) return; 
        if (bodyA === this.sensors.left) {
          this.isTouching.left = true;
          if (pair.separation > 0.5) this.sprite.x += pair.separation - 1;
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          if (pair.separation > 0.5) this.sprite.x -= pair.separation - 1;
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
        } else if (bodyA === this.sensors.nearbottom){
          this.isTouching.nearground = true;
        }
    }

}