import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { State } from './stateMachine';
import { collisionData, gameConfig } from '../../common/globalConfig';
// player state
import { randomInteger } from '../utils/utils';
const randlatency = 1000//randomInteger(0, 500);
const maxlength = 10;

console.log(`simulating server latency with ${randlatency}`);

export class Player extends Schema {

    @type('number')
    velocityX : Number = 0;
    @type('number')
    velocityY : Number = 0;
    @type('number')
    x : Number = 0;
    @type('number')
    y : Number = 0;
    // whether or not to flip the sprite
    @type('boolean')
    flipX: Boolean = false;
    // what the play can and can't collide with
    @type(['number'])
    collisionData = new ArraySchema<number>();
    @type('string')
    state: String = 'idle';
    // last acknowledged movement request by client stores [maxlength] request
    @type(['string'])
    ackreqIds = new ArraySchema<String>();
    // current request being processed will not switch until another request is sent
    @type('string')
    curreqId = null;
    @type('boolean') 
    onPlatform : Boolean =  false;
    @type(['boolean'])
    isTouching = new ArraySchema<Boolean>();
    // how long the current request is being processed
    @type('number')
    elaspsedTime : number = 0;
    // how long the player has been in present state
    @type('number')
    stateTime : number = 0;


    enqueueRequestId(reqId){
        if (this.curreqId !== null){
            if (this.curreqId !== this.ackreqIds[this.ackreqIds.length - 1]){
                this.ackreqIds.push(this.curreqId);
            }
            if (this.ackreqIds.length > maxlength) {
                this.ackreqIds.shift()
            }
        }
        this.curreqId = reqId;
    }

}

// General game state in a scene
export class GameState extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();


    addPlayer(id, x, y){
        this.players[id] = new Player();
        this.players[id].x = x;
        this.players[id].y = y;
        this.players[id].collisionData.push(collisionData.category.hard);
        console.log(this.players[id].collisionData);
        //console.log(typeof this.players[id].collisionData === typeof ArraySchema);
        console.log('player added to game state');
    }


    removePlayer(id){
       delete this.players[id];
    }

    @simulatelatency(gameConfig.simulatelatency, randlatency)
    updatePlayer(id, {x, 
                      y, 
                      velocityX,
                      velocityY,
                      stateTime,
                      flipX, 
                      collisionData, 
                      state, 
                      isTouching, 
                      onPlatform, 
                      reqId, 
                      elaspsedTime,

    }){
        // check if player exist
        if (this.players[id]){
            this.players[id].x = Math.trunc( x );
            this.players[id].y = Math.trunc( y );
            this.players[id].velocityX = velocityX;
            this.players[id].velocityY = velocityY;
            this.players[id].stateTime = stateTime;
            this.players[id].flipX = flipX;
            this.players[id].collisionData.splice(0, this.players[id].collisionData.length);
            this.players[id].collisionData.push(...collisionData);
            this.players[id].elaspsedTime = elaspsedTime;
            //collisionData.forEach( data => this.players[id].collisionData.push(data));
            this.players[id].state = state;
            if (reqId) {
                // console.log(this.players[id].lastackreqId, ' => ', lastackreqId);
                this.players[id].enqueueRequestId(reqId);
                // = lastackreqId;
            }
            if (gameConfig.debug) {
                //console.log(isTouching);
                //console.log(onPlatform);
                this.players[id].isTouching.splice(0, this.players[id].isTouching.length);
                this.players[id].isTouching.push(...isTouching);
                this.players[id].onPlatform = onPlatform;
            }
        }
    }
}



function simulatelatency(setlatency : Boolean, randlatency: number){
    return function(target: any, propertyKey: string, descriptor: any){
        const orgfunc = descriptor.value;
        descriptor.value = function (...args: any[]) {
            if (setlatency){
                //console.log(`simulate latency ${randlatency}`);
                setTimeout(() => {
                    orgfunc.apply(this, args);
                }, randlatency)
            } else {
                orgfunc.apply(this, args);
            }
        }
    }
}



