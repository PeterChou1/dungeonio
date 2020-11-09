import { StateMachine, SimulatedStateMachine } from '../state/stateMachine';
import { getplayerstate,  getsimplayerState }  from '../state/playerState';
import { gameConfig, messageType, collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';
const { Body } = Phaser.Physics.Matter.Matter; 


export default class Player {
    constructor(scene, x, y, scale, key, playerName) {
        console.log(`player name: ${playerName} joined`);
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(x, y, "player", 0);
        this.playerId = key;
        //  keeps track of server updates positions by server for interpolation purposes
        this.serverInterpolation = []
        this.physics = new PlayerPhysics(scene, this.sprite, x, y, scale, playerName);
        // default state of player values is idle
        this.playerstate = 'idle'
        this.playanimation(this.playerstate);
        this.disablegravity();
        this.scene.events.on('update', this.entityinterpolate, this);
    }


    playanimation(anims) {
        this.sprite.anims.play(anims);
    }

    updatePlayer({x, y, flipX, collisionData, state}) {
        //console.log('update player');
        //console.log({x, y, flipX, collisionData, state});
        // interpolate from old to new
        let serverInterpolation = [];
        for (let i = 0;  i <= 1; i += 0.25){
            let xInterp = Phaser.Math.Interpolation.Linear([this.sprite.x, x], i);
            let yInterp = Phaser.Math.Interpolation.Linear([this.sprite.y, y], i);
            //console.log(`coordinates x:${x}  y:${y}`);
            serverInterpolation.push(
                {
                    x: xInterp,
                    y: yInterp
                }
            )
        }
        console.log(serverInterpolation);
        this.serverInterpolation = serverInterpolation;
        this.sprite.setFlipX(flipX);
        this.sprite.setCollidesWith(collisionData);
        if (this.playerstate !== state){
            this.playanimation(state);
        }
        this.playerstate = state;
    }

    entityinterpolate(){
        // interpolate between new and older positions
        if (this.serverInterpolation.length > 0 && this.physics) {
            const coord = this.serverInterpolation.shift();
            this.sprite.setPosition(
                coord.x,
                coord.y
            )
        }
    }

    getPlayerState() {
        return this.playerstate;
    }

    disablegravity() {
        this.sprite.world.on('beforeupdate', this.cancelgravity, this);
    }

    enablegravity() {
        this.sprite.world.off('beforeupdate', this.cancelgravity, this);
    }

    cancelgravity() {
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
        this.physics.destroy();
        this.sprite.world.off('beforeupdate', this.cancelgravity, this);
        this.scene.events.off('update', this.entityinterpolate, this);
    }
}