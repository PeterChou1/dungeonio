import { StateMachine, SimulatedStateMachine } from '../state/stateMachine';
import { getplayerstate,  getsimplayerState }  from '../state/playerState';
import { gameConfig, messageType, collisionData } from '../../../../common/globalConfig.ts';
import { PlayerPhysics } from '../physics/playerPhysics';
const { Body } = Phaser.Physics.Matter.Matter; 


export default class Player {
    constructor(scene, x, y, scale, key) {
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(0, 0, "player", 0);
        this.playerId = key;

        this.buffer_size = 60; 
        //  keeps track of server updates positions by server for interpolation purposes
        this.server_updates = []
        this.physics = new PlayerPhysics(scene, this.sprite, x, y, scale, key);
        // default state of player values is idle
        this.playerstate = 'idle'

        if (this.scene.sessionId === this.playerId) {
            this.stateMachine = new StateMachine(
                'idle',
                getplayerstate(),
                [scene, this]
            )
            this.simStateMachine = new SimulatedStateMachine(
                scene,
                'idle',
                getsimplayerState(),
                [this]
            )
            // only client predict for local client player
            this.scene.events.on("update", this.clientpredict, this);
        } else {
            // player default animation
            this.playanimation(this.playerstate);
            this.disablegravity();
        }

        // diasable gravity for server control object
        // this.sprite.world.on('beforeupdate', this.disablegravity, this);
    }

    pushupdates(updates) {
        this.server_updates.push(updates);
        console.log(this.server_updates);
        if (this.server_updates.length >= this.buffer_size){
            this.server_updates.shift();
        }
    }

    simulateinput(serverstate, inputs) {
        //console.log('-------simulating inputs----------')
        //console.log(inputs);
        //console.log(inputs);
        // compare server state to client state
        // set position
        const deltaY = Math.abs(serverstate.x - this.sprite.x);
        const deltaX = Math.abs(serverstate.y - this.sprite.y);
        if (deltaY > 5 || deltaX > 5) {
            let startpos = {
                x: this.sprite.x,
                y: this.sprite.y
            }
            this.sprite.setPosition(
                serverstate.x,
                serverstate.y
            )
            //console.log('simulating inputs ', inputs);
            this.sprite.setVelocity(
                serverstate.velocityX,
                serverstate.velocityY
            )
            let interpolated = this.simStateMachine.simulateInput(
                this.sprite,
                serverstate.stateTime,
                serverstate.state,
                inputs
            )
            //console.log('interpolated:  ', interpolated);
            let endpos = interpolated[interpolated.length - 1];
            const predX = Math.abs(endpos.x - startpos.x);
            const predY = Math.abs(endpos.y - startpos.y);
            if (predX > 5 || predY > 5) {
            
            }
        }
    }

    playanimation(anims) {
        this.sprite.anims.play(anims);
    }

    updatePlayer({x, y, flipX, collisionData, state}) {
        //console.log('update player');
        //console.log({x, y, flipX, collisionData, state});
        const deltaX = Math.abs(x - this.sprite.x);
        this.sprite.setFlipX(flipX);
        this.sprite.setPosition(x, y);
        this.sprite.setCollidesWith(collisionData);
        if (this.playerstate !== state){
            this.playanimation(state);
        }
        this.playerstate = state;

    }

    getPlayerState() {
        return this.playerstate;
    }

    clientpredict() {
       this.stateMachine.step();
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
        if (this.scene.sessionId === this.key) {
            this.scene.events.off('update', this.clientpredict, this);
        } else {
            this.sprite.world.off('beforeupdate', this.cancelgravity, this);
        }
    }
}