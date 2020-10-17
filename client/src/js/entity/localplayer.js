import { StateMachine } from '../state/stateMachine';
import { getplayerstate }  from '../state/playerState';
import { collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';
const { Body } = Phaser.Physics.Matter.Matter; 

export class LocalPlayer {
    constructor(scene, x, y, scale) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        const {width : w, height: h} = this.sprite;
        console.log('---actual player ---')
        console.log(w, h);
        // initialize player state machine for client prediction
        this.stateMachine = new StateMachine(
            'idle',
            getplayerstate(),
            [scene, this]
        )
        this.playerstate = {
            x : x,
            y : y,
            collisionData : [collisionData.category.hard],
            flipX : false,
            state : 'idle'
        }
        this.physics = new PlayerPhysics(scene, this.sprite, this.stateMachine, x, y, scale);
        //this.sprite.setCollisionGroup(collisionData.group.noplayer);
        this.sprite.setCollisionCategory(collisionData.category.noplayer);
        // default state of player values are set by server
        //this.scene.events.on("update", this.clientpredict, this);
        //testSimulate(this);
        //this.scene.events.on("update", this.testSimulate, this);
        this.sprite.world.on('beforeupdate', this.disablegravity, this);
    }


    updatePlayer({x, y, flipX, collisionData, state}) {
        //console.log('update player');
        //console.log({x, y, flipX, collisionData, state});
        this.sprite.setPosition(x, y);
        this.sprite.setFlipX(flipX);
        this.sprite.setCollidesWith(collisionData);
        if (this.playerstate.state !== state){
            this.playanimation(state);
        }
        this.playerstate = {x: x, y: y, flipX: flipX, collisionData: collisionData, state: state};
    }

    playanimation(anims) {
        this.sprite.anims.play(anims);
    }

    clientpredict() {
        this.stateMachine.step();
    }

    testSimulate() {
        //if(this.scene.keys.right.isDown) {
            testSimulate(this);
        //}
    }

    disablegravity() {
        var gravity = this.sprite.world.localWorld.gravity;
        var body = this.sprite.body;
        Body.applyForce(body, body.position, {
            x: -gravity.x * gravity.scale * body.mass,
            y: -gravity.y * gravity.scale * body.mass
        });
    }

    //debug() {
    //    this.playerdebug = this.scene.add.text(10, 10, `Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform} \n x: ${this.sprite.x} y: ${this.sprite.y}`,  
    //                                           { font: '"Times"', fontSize: '32px' });
    //}
    //
    //debugUpdate(){
    //    this.playerdebug.setText(`Player State: ${this.stateMachine.state} \n isTouching {left: ${this.physics.isTouching.left}, right: ${this.physics.isTouching.right}, ground: ${this.physics.isTouching.ground}, top: ${this.physics.isTouching.top}, nearbottom: ${this.physics.isTouching.nearground}} onPlatfrom: ${this.physics.onPlatform}\n x: ${this.sprite.x} y: ${this.sprite.y}`,   
    //                                         { font: '"Times"', fontSize: '32px' });
    //}
    
    destroy() {
        this.sprite.destroy();
        this.scene.events.off('update', this.clientpredict, this);
    }
}

function testSimulate(player) {
    // apply jump 
    player.sprite.setVelocityY(-10);
    // clear body forces
    //player.sprite.body.force.y = 0
    //var gravity = player.sprite.world.localWorld.gravity;
    //var body = player.sprite.body;
    //var gravX = gravity.x * gravity.scale * body.mass;
    //var gravY = gravity.y * gravity.scale * body.mass;
    //Body.applyForce(body, body.position, {
    //    x: gravX,
    //    y: gravY
    //});
    //// simulate using engine step
    for (let i = 0; i < 100; i++){
        player.scene.matter.step();
        console.log('---forces---');
        console.log(player.sprite.body.force);
        console.log('---velocity---');
        console.log(player.sprite.body.velocity);
        console.log(`body postion x:${player.sprite.body.position.x} y:${player.sprite.body.position.y}`);
        console.log('--- player physics ---');
        console.log(player.physics.isTouching.ground);
    }
    //const hardobject = player.scene
    //                         .objectgroup
    //                         .hard
    //                         .filter( tile => tile.physics.matterBody !== undefined )
    //                         .map( tile => tile.physics.matterBody.body);
    //console.log('---hard---');
    //console.log(hardobject);
    //console.log('---soft---');
    //console.log(player.scene.objectgroup.soft);
    //console.log('gravity');
    //console.log(gravY);
    //for (let i = 0; i < 200; i++){
    //    //player.sprite.body.force.y = player.sprite.body.mass * gravity.y * gravity.scale;
    //    Body.update(player.sprite.body, 16.5, 1, 1);
    //    console.log('---forces---');
    //    console.log(player.sprite.body.force);
    //    console.log('---velocity---');
    //    console.log(player.sprite.body.velocity);
    //    console.log(`body postion x:${player.sprite.body.position.x} y:${player.sprite.body.position.y}`);
    //    console.log('---collisions---')
    //    console.log(player.sprite.body);
    //    let collide = Query.collides(
    //        player.physics.sensors.nearbottom, 
    //        hardobject
    //    )
    //    console.log(collide);
    //    if (collide.length > 0 && !ground){
    //        Body.applyForce(body, body.position, {
    //            x: -gravX,
    //            y: -gravY
    //        });
    //        player.sprite.setVelocityY(0);
    //        ground = true;
    //    }
    //}
}