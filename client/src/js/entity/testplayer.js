import Phaser from 'phaser';
import {collisionData, gameConfig} from '../../../../common/globalConfig.ts';
const {Body, Bodies} = Phaser.Physics.Matter.Matter;


export class PlayerT extends Phaser.Physics.Matter.Sprite {


    constructor(scene, x, y, playerId, w = 50, h = 75, scale = 1){
        super(scene.matter.world, x, y, '')
        this.playerId = playerId;
        this.scene = scene;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false};
        this.onPlatform = false;
        this.FlipX = false;
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * scale, { chamfer: {radius: 5}});
        this.sensors = {
            nearbottom: Bodies.rectangle(0, h - 15, w, 50, {isSensor: true}),
            bottom: Bodies.rectangle(0, h - 38, w, 4, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, {isSensor: true}), 
            top: Bodies.rectangle(0, -h + 38, w, 2, {isSensor: true}),
            neartop: Bodies.rectangle(0, -h + 13, w, 50, {isSensor: true})
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
        //this.scene.matter.world.on("beforeupdate", this.resetTouching, this);
        this.setCollisionCategory(collisionData.group.noplayer);
        if (gameConfig.debug){
            this.debug()
        }
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

    update() {
    }

    debug() {
        this.playerdebug = this.scene.add.text(10, 100, '',  { font: '"Times"', fontSize: '32px' });
    }

    debugUpdate({x, y, flipX, collisionData, state, isTouching, onPlatform}){
        this.playerdebug.setText(` clientId: ${this.playerId} state: ${state} onPlatform: ${onPlatform} \n x: ${x}, y: ${y} \n isTouching {left: ${isTouching[0]}, right: ${isTouching[1]}, ground: ${isTouching[2]}, top: ${isTouching[3]}, nearbottom: ${isTouching[4]}} \n collision data: ${collisionData} \n flipX : ${flipX}`,   
                                             { font: '"Times"', fontSize: '32px' });
    }


}