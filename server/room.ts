import { Room, Client } from "colyseus";
import { GameState } from "./state/state";
import '@geckos.io/phaser-on-nodejs';
import Phaser from 'phaser';
import {config} from './config/gameConfig';

export class GameRoom extends Room<GameState> {
    game : Phaser.Game
    scene : Phaser.Scene
    onCreate (options) {
        // inject game room into game instance
        config.callbacks = {
            preBoot: () => {
                return this
            }
        }
        this.game = new Phaser.Game(config);
        console.log('game started');
        this.scene = this.game.scene.getScene('start');
        this.setState(new GameState());
        console.log('---scene---');
        console.log(`width: ${this.scene.scale.width} height: ${this.scene.scale.height}`);
        //this.onMessage(messageType.playerinput, (client, data) => {
        //    console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
        //})

    }

    onJoin (client) {
        console.log(`client with id: (${client.sessionId}) joined`);
        //@ts-ignore add player custom method
        this.scene.addPlayer(client.sessionId);
    }

    onLeave (client){
        console.log(`client with id (${client.sessionId}) left`)
        //@ts-ignore
        this.scene.removePlayer(client.sessionId);

    }

    onDispose(){

    }
}