import path from 'path';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, LobbyRoom, RelayRoom } from 'colyseus';
import { GameRoom } from './room';
const port = Number(process.env.Port || 4000);
const app = express();
app.use(cors());
app.use(express.json());


const gameServer = new Server({
    server: createServer(app),
    express: app,
    pingInterval: 0
})
// in order for phaser Headless to work need to load window dom script



gameServer.define('game', GameRoom)
          .enableRealtimeListing();

////const http = require('http').createServer(app);
////const io = require('socket.io')(http);
////const port = process.env.PORT || 8080;
////
//app.use('/public', express.static(path.resolve(__dirname, '../src/assets')));
//app.use(express.static(path.resolve(__dirname, '../dist')));
//app.get('/', (req, res) => {
//    console.log('recieved request');
//    res.sendFile(path.resolve(__dirname, '../dist/index.html'))
//})
gameServer.listen(port);
console.log(`Listening on http://localhost:${ port }`);