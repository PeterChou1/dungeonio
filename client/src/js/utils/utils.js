import _ from "lodash"
// utilities functions

export const createanims = (scene, anims) => {
    anims.forEach((anim) => {
        anim.frames = scene.anims.generateFrameNumbers(...anim.frames)
        const anims = scene.anims.create(anim);
        console.log('msPerFrame', anims.msPerFrame);
    })
}


export function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* 
  request queue to keep track of request sent to server 

    Basic Idea
                            (sends inputs (move 1) id: 0)
    (pos: 0)        client       -------------->               server
                      |
(client               |
prediction)           |
                      v     (sends inputs (move 1) id: 1)
    (pos: 1)        client        -------------->              server 
                      |
(client               |
prediction)           |
                      v   (server respond to request id: 1)
                    client        <--------------              server
 client sees
 request 1 prediction
 is processed so applies 
 prediction to server
 response id: 1 
 if reponse match prediction
 do nothing
 if does not match response 
 interpolate
*/
export class RequestQueue {
    constructor() {
        // stores unacknowledge request not processed by the server
        this.unackReq = [];
    }
    /*
     adjust timing based on how long server has been processing your request
     */
    setcurrentrequest(serverelapsed){
        // if there is 1 request in the queue
        if (!this.isEmpty()){
            if (this.unackReq.length === 1) {
                const request = this.unackReq[0];
                if (serverelapsed !== undefined) {
                    request.serveradjusted = request.created + serverelapsed
                }
                const elapsedTime = new Date().getTime() - request.serveradjusted;
                //console.log('---elaspsed time ---');
                //console.log(elapsedTime);
                request.elapsed = elapsedTime;
            } else if (this.unackReq.length > 1){
                const lastrequest = this.unackReq[this.unackReq.length - 1];
                const firstrequest = this.unackReq[0];
                if (serverelapsed !== undefined) {
                    firstrequest.serveradjusted = firstrequest.created + serverelapsed
                }
                const elapsedTime = this.unackReq[1].created - firstrequest.serveradjusted;
                firstrequest.elapsed = elapsedTime;
                lastrequest.elapsed = new Date().getTime() - lastrequest.created;
            }
        }
    }

    enqueue(request) {
        //console.log('----enqueue request---');
        // calculate time elaspse for previous request
       // console.log(request);
        if (!this.isEmpty()){
            const lastrequest = this.unackReq[this.unackReq.length - 1];
            let elapsedTime = request.created - lastrequest.serveradjusted;
            //console.log('----- elaspsed ------');
            //console.log(elapsedTime);
            lastrequest.elapsed = elapsedTime;
        }
        this.unackReq.push(request);
    }

    dequeue(ackReqIds) {
        for (const id of ackReqIds){
            if (!this.isEmpty()){
                //console.log('----dequeue request----');
                const lastreq = this.unackReq[0];
                if (lastreq.id === id) {
                    this.unackReq.shift();
                }
            }
        }
        //console.log('------')
        //console.log(`unacknowledged request:  ${this.unackReq.length}`);
        //console.log(this.unackReq);
    }

    isEmpty() {
        return this.unackReq.length === 0;
    }

    clearRequestQueue() {
        this.unackReq = [];
    }

    getinputs() {
        return _.cloneDeep(this.unackReq);
    }

}

