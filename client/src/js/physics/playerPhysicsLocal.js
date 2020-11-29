import Phaser from "phaser";
import {collisionData} from '../../../../common/globalConfig.ts';
const {Body, Bodies} = Phaser.Physics.Matter.Matter;
const PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;
const MatterGameObject = Phaser.Physics.Matter.MatterGameObject;
/*
 Encapsulate all physics behaviour for player
*/
export class PlayerPhysics {

    constructor(scene, sprite, x, y, scale){
        this.sprite = sprite;
        this.scale = scale;
        //const {width : w, height: h} = this.sprite;
        console.log('local sprite physics');
        console.log(sprite.width);
        console.log(sprite.height)
        this.scene = scene;
        this.isTouching = {left: false, right: false, ground: false, top: false, nearground: false, sensor: false};
        this.onPlatform = false;
        // within the platform fall state
        this.platformFall = false;
        this.collisionList = [collisionData.category.hard];

        this.debugtext = scene.add.text(10, 100, '');
        console.log(`set scale ${scale}`);
        //this.sprite.setScale(scale);
        console.log('--player--');
        console.log(`width ${w} height: ${h}`);

        this.hitbox =  PhysicsEditorParser.parseBody(0, 0, this.scene.frameData['adventurer-idle-00']);
        const w = (this.hitbox.bounds.max.x - this.hitbox.bounds.min.x) * scale;
        const h = (this.hitbox.bounds.max.y - this.hitbox.bounds.min.y) * scale;
        this.sensors = {
            nearbottom: Bodies.rectangle(0, h / 2 + 25, w, 50, {
                isSensor: true,
            }),
            bottom: Bodies.rectangle(0, h / 2 - 3, w * 0.80, 10, {
                isSensor: true,
            }),
            left: Bodies.rectangle(-w / 2 - 10, 0, 2, h * 0.50,  {
                isSensor: true,
            }),
            right: Bodies.rectangle(w / 2 + 10, 0, 2, h * 0.50, {
                isSensor: true,
            }), 
            top: Bodies.rectangle(0, -h / 2 + 3, w * 0.80, 10, {
                isSensor: true,
            }),
            neartop: Bodies.rectangle(0, -h / 2 - 25, w, 50, {
                isSensor: true,
            })
        };
        const compoundBody = Body.create({
            parts: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom, this.sensors.neartop],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard        
            }
        })
        // create a player container sprite

        this.physicsprite = this.scene.matter.add.sprite(x, y, '');
        this.physicsprite.setExistingBody(compoundBody)
                         .setFixedRotation()
                         .setCollisionGroup(collisionData.group.noplayer);
        this.sprite
            .setExistingBody(this.hitbox)
            .setScale(scale)
            .setFixedRotation()
            .setPosition(x, y)
            .setCollisionCategory(collisionData.category.player)
        this.unsubscribers = [
            this.scene.matterCollision.addOnCollideStart({
                objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
                callback: this.onSensorCollide,
                context: this
            }),
            this.scene.matterCollision.addOnCollideActive({
                objectA: [this.sensors.bottom, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.nearbottom],
                callback: this.onSensorCollide,
                context: this
            }),
            this.scene.matterCollision.addOnCollideStart({
                objectA: [this.sensors.bottom],
                objectB: this.scene.objectgroup.soft,
                callback: () => {
                    console.log('collide with platform');
                    this.onPlatform = true;
                    this.collisionList = [collisionData.category.hard, collisionData.category.soft];
                    this.sprite.setCollidesWith(this.collisionList);
                    this.physicsprite.setCollidesWith(this.collisionList);
                },
                context: this
            }),
            this.scene.matterCollision.addOnCollideActive({
                objectA:  [this.sensors.bottom],
                objectB: this.scene.objectgroup.soft,
                callback: () => {
                    console.log('keep colliding');
                    if (!this.platformFall){
                        this.onPlatform = true;
                        this.collisionList = [collisionData.category.hard, collisionData.category.soft];
                        this.sprite.setCollidesWith(this.collisionList);
                        this.physicsprite.setCollidesWith(this.collisionList);
                    } else {
                        this.collisionList = [collisionData.category.hard];
                        this.sprite.setCollidesWith(this.collisionList);
                        this.physicsprite.setCollidesWith(this.collisionList);
                    }
                },
                context: this
            }),
            this.scene.matterCollision.addOnCollideEnd({
                objectA:  [this.sensors.bottom],
                objectB: this.scene.objectgroup.soft,
                callback: () => {
                    console.log('platform end collide');
                    this.platformFall = false;
                    this.onPlatform = false;
                    this.collisionList = [collisionData.category.hard];
                    this.sprite.setCollidesWith(this.collisionList);
                    this.physicsprite.setCollidesWith(this.collisionList);
                },
                context: this
            })
        ]

        this.scene.events.on('update', this.setBody, this);
        this.scene.events.on('update', this.debugUpdate, this);
        //this.sprite.world.on('beforeupdate', this.doublegravity, this);
        this.scene.matter.world.on("beforeupdate", this.resetTouching, this);

        //this.scene.input.on('pointermove', function (pointer) {
        //    //console.log(this.clicksensor);
        //    this.physicsprite.setPosition(pointer.x, pointer.y);
        //    //this.clicksensor.setPosition(pointer.x, pointer.y);
        //
        //}.bind(this));
        //this.scene.matter.world.on('beforeupdate', this.cancelgravity, this);
    }


    debugUpdate() {
        //this.debugtext.setText(`top:${this.isTouching.top} right: ${this.isTouching.right} left: ${this.isTouching.left} \n
        //                        bottom: ${this.isTouching.ground} nearbottom: ${this.isTouching.nearground} \n sensor: ${this.isTouching.sensor}`);
    }


    setBody(){
        //console.log(this.sprite.body);
        //console.log(this.isTouching);
        const {x: x, y: y} = this.sprite;
        this.physicsprite.setPosition(x, y);
        //console.log(this.isTouching);
        //const {x: x, y: y} = this.sprite;
        if (this.sprite.anims.currentFrame) {
            var sx = this.sprite.x;
            var sy = this.sprite.y;
            var sav = this.sprite.body.angularVelocity;
            var sv = this.sprite.body.velocity;     
            var flipX = this.sprite.flipX;       
            const hitbox = PhysicsEditorParser.parseBody(0, 0, this.scene.frameData[this.sprite.anims.currentFrame.textureFrame]);
            //console.log(hitbox.friction);
            //console.log(hitbox.frictionStatic);
            //console.log(hitbox.frictionAir);
            //const compoundBody = Body.create({
            //    parts: [hitbox],
            //    frictionStatic: 0,
            //    frictionAir: 0.02,
            //    friction: 0.1,
            //    collisionFilter: {
            //        mask: collisionData.category.hard           
            //    }
            //})
            this.sprite.setScale(1)
                           .setExistingBody(hitbox)
                           .setScale(2)
                           .setPosition(sx, sy)
                           .setVelocity(sv.x, sv.y)
                           .setAngularVelocity(sav)
                           .setCollisionCategory(collisionData.category.player)
                           .setCollidesWith(this.collisionList)
                           .setFixedRotation();
            if (flipX) {
                Body.scale(hitbox, -1, 1);
                //this.sprite.setOriginFromFrame();
                this.sprite.setOrigin(1 - this.sprite.originX, this.sprite.originY);
            }

            //this.sprite.setCollidesWith(this.collisionList);
            //this.container.setCollidesWith(this.collisionList);
            //console.log(this.collisionList);
            
            //this.sprite.setOriginFromFrame();
    
            //Body.setPosition(this.compoundBody, {x : sx, y: sy});
        }
    }

    cancelgravity() {
        var gravity = this.scene.matter.world.localWorld.gravity;
        Body.applyForce(this.physicsprite.body, this.physicsprite.body.position, {
            x: -gravity.x * gravity.scale * this.physicsprite.body.mass,
            y: -gravity.y * gravity.scale * this.physicsprite.body.mass
        });
    }

    resetTouching() {
        this.isTouching.left = false;
        this.isTouching.right = false;
        this.isTouching.ground = false;
        this.isTouching.top = false;
        this.isTouching.nearground = false;
        this.isTouching.sensor = false;
    }

    onSensorCollide({ bodyA, bodyB, pair }) {
        if (bodyB.isSensor) {
            return;
        };
        //console.log(bodyB);
        if (bodyB.parent === this.sprite.body) {
            //console.log('hit parent body');
            return;
        }
        if (bodyA === this.sensors.left) {
          //console.log('left');
          this.isTouching.left = true;
          // if other object is player seperate both players
          //if (pair.separation > 0.5) {
          //  this.sprite.x += (pair.separation - 0.5);
          //}
        } else if (bodyA === this.sensors.right) {
          this.isTouching.right = true;
          //if (pair.separation > 0.5) {
          //  this.sprite.x -= (pair.separation - 0.5);
          //}
        } else if (bodyA === this.sensors.bottom) {
          this.isTouching.ground = true;
        } else if (bodyA === this.sensors.top) {
          this.isTouching.top = true;
          //console.log(bodyB);
        } else if (bodyA === this.sensors.nearbottom){
          this.isTouching.nearground = true;
        } else if (bodyA === this.mainBody) {
        }
    }


    destroy(){
        this.unsubscribers.forEach(
            unsubscribe => {
                unsubscribe();
            }
        )
    }

}
