import Phaser from 'phaser';
import {collisionData} from '../../../../common/globalConfig.ts';
//import * as MatterJS from 'matter-js';
//MatterJS = Phaser.Physics.Matter.Matter;
const {Body, Bodies} = Phaser.Physics.Matter.Matter;


export class PlayerM extends Phaser.Physics.Matter.Sprite {


    constructor(scene, x, y, w = 50, h = 37, scale = 2){
        super(scene.matter.world, x, y, '')
        this.scene = scene;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false};
        this.onPlatform = false;
        this.FlipX = false;
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * scale, { chamfer: {radius: 5}});
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
        this.setExistingBody(compoundBody)
        //this.setScale(scale)
        this.setFixedRotation()
        this.setPosition(x, y);
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
                this.collideswith = [collisionData.category.hard, collisionData.category.soft]
                this.setCollidesWith(this.collideswith)
            },
            context: this
        })
        this.scene.matterCollision.addOnCollideEnd({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = false;
                this.collideswith = [collisionData.category.hard]
                this.setCollidesWith(this.collideswith)
            },
            context: this
        })
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
        console.log('---end sprite---');
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
          if (pair.separation > 0.5) this.x += pair.separation - 1;
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          if (pair.separation > 0.5) this.x -= pair.separation - 1;
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
        } else if (bodyA === this.sensors.nearbottom){
          this.isTouching.nearground = true;
        }
    }

    destroy() {
        this.sprite.destroy();
    }

}