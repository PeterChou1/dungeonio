import path from 'path';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
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




gameServer.define('game', GameRoom)
          .enableRealtimeListing();

gameServer.listen(port);
console.log(`Listening on http://localhost:${ port }`);