//@ts-ignore
import { messageType } from "../../common/globalConfig.ts";

export class AOI {
  clearId;
  aoiId: {
    x: number;
    y: number;
  };
  entities;
  clients;
  width;
  height;
  x;
  y;
  constructor(width, height, x, y, id) {
    this.aoiId = id;
    this.entities = {};
    this.clients = {};
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    console.log(`id x:${this.aoiId.x} y: ${this.aoiId.y} aoi x:${x} y:${y}`);
    this.clearId = setInterval(this.updateEntity.bind(this), 100);
  }

  inAOI(x, y) {
    return (
      this.x <= x &&
      x <= this.x + this.width &&
      this.y <= y &&
      y <= this.y + this.height
    );
  }
  /**
   * should be used for adding a client (real player) to current AOI only
   * @param clientGameObject
   * @param init optional parameter which will broadcast add player to client being
   * added (used for init)
   */
  addClient(clientGameObject, init?) {
    // send to the client add to every other client within the aoi
    for (const clientid in this.clients) {
      this.clients[clientid].send(messageType.aoiadd, {
        ...clientGameObject.getPosition(),
        ...clientGameObject.getMeta(),
      });
    }
    // add all entity within aoi to client
    for (const id in this.entities) {
      clientGameObject.client.send(messageType.aoiadd, {
        ...this.entities[id].getPosition(),
        ...this.entities[id].getMeta(),
      });
    }
    this.clients[clientGameObject.id] = clientGameObject.client;
    this.entities[clientGameObject.id] = clientGameObject;
    if (init) {
      clientGameObject.client.send(messageType.aoiadd, {
        ...clientGameObject.getPosition(),
        ...clientGameObject.getMeta(),
      });
    }
  }

  /**
   * should be used for removing a client from current AOI
   * @param clientGameObject
   * @param quit optional parameter used for players quiting the game
   * ie shutting down the browser
   */
  removeClient(clientGameObject, quit?) {
    if (quit) {
      clientGameObject.client.send(messageType.aoiremove, {
        id: clientGameObject.id,
      });
    }
    delete this.clients[clientGameObject.id];
    delete this.entities[clientGameObject.id];

    for (const clientid in this.clients) {
      this.clients[clientid].send(messageType.aoiremove, {
        id: clientGameObject.id,
      });
    }
    // remove all entities within aoi for client
    for (const id in this.entities) {
      clientGameObject.client.send(messageType.aoiremove, {
        id: id,
      });
    }
  }
  /**
   * @description used for non-player entity broadcast to all clients within AOI that an
   * entity has been added
   * @param entity
   */
  addEntity(entity) {
    this.entities[entity.id] = entity;
    this.broadcast(messageType.aoiadd, {
      ...entity.getPosition(),
      ...entity.getMeta(),
    });
  }
  /**
   * @description used for non-player entity broadcast to all clients within AOI that an
   * entity has been removed
   * @param entity
   */
  removeEntity(entity) {
    delete this.entities[entity.id];
    this.broadcast(messageType.aoiremove, {
      id: entity.id,
    });
  }
  /**
   * @description Update loop for current AOI instanitate on start on AOI
   * and shutdown on destruction
   */
  private updateEntity() {
    //console.log(`update entity aoi (x:${this.aoiId.x} y:${this.aoiId.y})`);
    this.broadcast(messageType.aoiupdate, this.getAOIEntities());
  }
  /**
   * Broadcast to all clients within AOI
   * @param msgtype used type from messageType from globalConfig
   * @param msg
   */
  broadcast(msgtype, msg) {
    for (const clientid in this.clients) {
      this.clients[clientid].send(msgtype, msg);
    }
  }
  /**
   * @description get all entity within AOI
   * @returns {array} of all state within aoi
   */
  getAOIEntities() {
    const entities = {};
    for (const id in this.entities) {
      entities[id] = this.entities[id].getState();
    }
    return entities;
  }
  destroy() {
    clearInterval(this.clearId);
  }
}
