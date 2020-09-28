import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { State } from './stateMachine';
import { collisionData, gameConfig } from '../../common/globalConfig';
// player state
import { randomInteger } from '../utils/utils';

export class Player extends Schema {
    @type('number')
    x : Number = 0;
    @type('number')
    y : Number = 0;
    @type('boolean')
    flipX: Boolean = false; // whether or not to flip the sprite
    @type(['number'])
    collisionData = new ArraySchema<number>(); // what the play can and can't collide with
    @type('string')
    state: String = 'idle';

    // only avaliable if gameConfig.debug = true
    @type('boolean') 
    onPlatform : Boolean =  false;
    @type(['boolean'])
    isTouching = new ArraySchema<Boolean>();
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

    @simulatelatency
    updatePlayer(id, {x, y, flipX, collisionData, state, isTouching, onPlatform}){
        //console.log(x, y, flipX, collisionData, state);
        this.players[id].x = Math.trunc( x );
        this.players[id].y = Math.trunc( y );
        this.players[id].flipX = flipX;
        this.players[id].collisionData.splice(0, this.players[id].collisionData.length);
        this.players[id].collisionData.push(...collisionData);
        //collisionData.forEach( data => this.players[id].collisionData.push(data));
        this.players[id].state = state;
        if (gameConfig.debug) {
            //console.log(isTouching);
            //console.log(onPlatform);
            this.players[id].isTouching.splice(0, this.players[id].isTouching.length);
            this.players[id].isTouching.push(...isTouching);
            this.players[id].onPlatform = onPlatform;
        }
    }
}


function simulatelatency(target: any, propertyKey: string, descriptor: any){
    const orgfunc = descriptor.value;
    descriptor.value = function (...args: any[]) {
        if (gameConfig.simulatelatency){
            const randlatency = randomInteger(0, 500);
            console.log(`simulating server latency with ${randlatency}`);
            setTimeout(() => {
                orgfunc.apply(this, args);
            }, randlatency)
        } else {
            orgfunc.apply(this, args);
        }
    }
}



