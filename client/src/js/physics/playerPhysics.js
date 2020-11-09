import Phaser from "phaser";
import {collisionData} from '../../../../common/globalConfig.ts';
const {Body, Bodies} = Phaser.Physics.Matter.Matter;
/*
 Encapsulate all physics behaviour for player
*/
export class PlayerPhysics {
    constructor(scene, sprite, x, y, scale, playerName){
        this.sprite = sprite;
        const {width : w, height: h} = this.sprite;
        this.scene = scene;
        this.sprite.setScale(scale);
        console.log('--player--');
        console.log(`width ${w} height: ${h}`);
        //console.log(this.sprite instanceof Phaser.)

        this.playerNamedText = this.scene.add.text(0, 0, playerName);
        this.playerNamedText.font = "Arial";
        this.playerNamedText.setOrigin(0.5, 0.5);

        this.mainBody = Bodies.rectangle(0, 0, w * 0.6, h * scale, { chamfer: {radius: 15}});
        const compoundBody = Body.create({
            parts: [this.mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            collisionFilter: {
                mask: collisionData.category.hard,
            }
        });
        this.sprite.setExistingBody(compoundBody)
                   .setFixedRotation()
                   .setPosition(x, y);

        this.scene.events.on('update', this.update, this);
    }

    update() {
        this.playerNamedText.setPosition(this.sprite.x, this.sprite.y - 50);
    }
    
    destroy() {
        this.scene.events.off('update', this.update, this);
        this.playerNamedText.destroy();
    }
}