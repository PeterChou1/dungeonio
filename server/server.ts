import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameRoom } from './room';
import { monitor } from "@colyseus/monitor";

  
const port = Number(process.env.Port || 4000);
const monitorport = Number(process.env.MonitorPort || 5000);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/colyseus", monitor());




const gameServer = new Server({
    server: createServer(app),
    express: app,
    pingInterval: 0
})




gameServer.define('game', GameRoom)
          .enableRealtimeListing();
gameServer.listen(port);
console.log(`Game Server Listening on http://localhost:${ port }`);

app.listen(monitorport, function(){
    console.log(`Monitor Server Listening on http://localhost:${ monitorport }/colyseus`);
})