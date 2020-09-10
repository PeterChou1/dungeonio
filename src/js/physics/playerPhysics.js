import Phaser from "phaser";
import { collisionData } from '../config/globalconfig';
const {Body, Bodies} = Phaser.Physics.Matter.Matter;
/*
 Encapsulate all physics behaviour for player
*/
export default class PlayerPhysics {

    constructor(player, scale){
        this.scene = player.scene;
        this.sprite = player.sprite;
        this.stateMachine = player.stateMachine;
        this.isTouching = {left: false, right: false, ground: false, top: false};
        this.onPlatform = false;
        const {width : w, height: h} = this.sprite;
        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h * 2, { chamfer: {radius: 10}});
        this.sprite.setScale(scale);
        this.sensors = {
            bottom: Bodies.rectangle(0, h, w , 2, {isSensor: true}),
            left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5,  {isSensor: true}),
            right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, {isSensor: true}), 
            top: Bodies.rectangle(0, -h, w, 2, {isSensor: true})
        };
        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
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

        scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
            callback: this.onSensorCollide,
            context: this
        });
        scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top],
            callback: this.onSensorCollide,
            context: this
        });
        scene.matterCollision.addOnCollideStart({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                this.onPlatform = true;
                this.sprite.setCollidesWith([collisionData.category.hard, collisionData.category.soft])
            },
            context: this
        })
        scene.matterCollision.addOnCollideActive({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => {
                if (this.stateMachine.state === "platformfall"){
                    this.sprite.setCollidesWith([collisionData.category.hard])
                } 
            },
            context: this
        })
        
        scene.matterCollision.addOnCollideEnd({
            objectA: this.sensors.bottom,
            objectB: this.scene.objectgroup.soft,
            callback: () => this.sprite.setCollidesWith([collisionData.category.hard]),
            context: this
        })
    

    }


    resetTouching() {
        this.isTouching.left = false;
        this.isTouching.right = false;
        this.isTouching.ground = false;
        this.isTouching.top = false;
    }

    onSensorCollide({ bodyA, bodyB, pair }) {
        if (bodyB.isSensor) return; 
        if (bodyA === this.sensors.left) {
          this.isTouching.left = true;
          //if (pair.separation > 0.5) this.sprite.x += pair.separation - 0.5;
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          //if (pair.separation > 0.5) this.sprite.x -= pair.separation - 0.5;
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
        }
    }

}