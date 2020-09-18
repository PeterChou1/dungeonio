import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { State } from './stateMachine';
import { collisionData } from '../../common/globalConfig';
import { playerConfig } from '../config/playerConfig';
// player state
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


    updatePlayer(id, x, y){


    }
}



