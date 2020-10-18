import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameRoom } from './room';
import { monitor } from "@colyseus/monitor";
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';
const port = Number(process.env.PORT || 80);


const app = express();
app.use(cors());
app.use(express.json());
app.use("/colyseus", monitor());
if (env === 'production'){
    console.log('---set environment---');
    console.log(path.resolve(__dirname, '../common/assets'));
    console.log(path.resolve(__dirname, '../client/dist'));
    app.use("/public", express.static(path.resolve(__dirname, '../common/assets')));
    app.use("/", express.static(path.resolve(__dirname, '../client/dist')));
}



const gameServer = new Server({
    server: createServer(app),
    express: app,
    pingInterval: 0
})




gameServer.define('game', GameRoom)
          .enableRealtimeListing();
gameServer.listen(port);
gameServer.onShutdown(function(){
    console.log(`game server is going down.`);
});
console.log(`Server listening on port: ${ port }`);
console.log('using environment ', env)


