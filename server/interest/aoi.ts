import { messageType } from "../../common/config/globalConfig";
import { gameObject } from "../game.v2/gameobject";
import { Player } from "../game.v2/player";

export class AOI {
  clearId;
  aoiId: {
    x: number;
    y: number;
  };
  entities: {
    [id: string]: gameObject;
  };
  // adjacent players in different AOI
  adjacentPlayer: {
    [id: string]: Player;
  };
  // save states of entity used for diffing
  savedState;
  // clients in current aoi
  clients;
  // clients in adjacent aoi
  adjacentClient;
  width;
  height;
  x;
  y;
  constructor(width, height, x, y, id) {
    this.aoiId = id;
    this.entities = {};
    this.savedState = {};
    this.clients = {};
    this.adjacentClient = {};
    this.adjacentPlayer = {};
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
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
   * @description update a specific player which has been sleeping to current AOI conditions
   */
  updatePlayer(clientGameObject: Player) {
    for (const id in this.entities) {
      if (id !== clientGameObject.id) {
        clientGameObject.client.send(messageType.aoiadd, {
          ...this.entities[id].getPosition(),
          ...this.entities[id].getMeta(),
        });
      }
    }

    if (Object.values(this.entities).includes(clientGameObject)) {
      clientGameObject.client.send(messageType.aoiupdate, {
        [clientGameObject.id]: clientGameObject.getState(),
      });
    }
  }

  /**
   * @description adds client in current AOI for adjacent clients
   * @param clientGameObject
   * @param alreadyAdjacent if player is already adjacent do not send aoi adds
   */
  addAdjacentClient(clientGameObject: Player, alreadyAdjacent: boolean) {
    this.adjacentClient[clientGameObject.id] = clientGameObject.client;
    this.adjacentPlayer[clientGameObject.id] = clientGameObject;

    if (!alreadyAdjacent) {
      const state = clientGameObject.getInternalState();
      if (!state.asleep) {
        for (const id in this.entities) {
          clientGameObject.client.send(messageType.aoiadd, {
            ...this.entities[id].getPosition(),
            ...this.entities[id].getMeta(),
          });
        }
      }
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(messageType.aoiadd, {
            ...clientGameObject.getPosition(),
            ...clientGameObject.getMeta(),
          });
        }
      }
    }
  }
  /**
   * @description remove entities in current AOI for adjacent clients
   */
  removeAdjacentClient(clientGameObject: Player, alreadyAdjacent: boolean) {
    delete this.adjacentClient[clientGameObject.id];
    delete this.adjacentPlayer[clientGameObject.id];
    // remove all entities within aoi for client
    if (!alreadyAdjacent) {
      const state = clientGameObject.getInternalState();
      if (!state.asleep) {
        for (const id in this.entities) {
          clientGameObject.client.send(messageType.aoiremove, {
            id: id,
          });
        }
      }
      // remove tell all other players to remove client
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(messageType.aoiremove, {
            id: clientGameObject.id,
          });
        }
      }
    }
  }
  /**
   * @description should be used for adding a client (real player) to current AOI only
   * @param clientGameObject
   * @param init optional parameter which will broadcast add player to client being
   * added (used for init)
   */
  addClient(clientGameObject: Player, init?) {
    if (init) {
      // add to every other client within the aoi expect the ones that are asleep
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(messageType.aoiadd, {
            ...clientGameObject.getPosition(),
            ...clientGameObject.getMeta(),
          });
        }
      }
      // add all entity within aoi to client
      const state = clientGameObject.getInternalState();
      if (!state.asleep) {
        for (const id in this.entities) {
          clientGameObject.client.send(messageType.aoiadd, {
            ...this.entities[id].getPosition(),
            ...this.entities[id].getMeta(),
          });
        }
      }
      clientGameObject.client.send(messageType.aoiadd, {
        ...clientGameObject.getPosition(),
        ...clientGameObject.getMeta(),
      });
    }

    this.clients[clientGameObject.id] = clientGameObject.client;
    this.entities[clientGameObject.id] = clientGameObject;
    //this.savedState[clientGameObject.id] = clientGameObject.getState();
  }

  /**
   * should be used for removing a client from current AOI
   * @param clientGameObject
   * @param quit optional parameter used for players quiting the game
   */
  removeClient(clientGameObject: Player, quit?) {
    delete this.clients[clientGameObject.id];
    delete this.entities[clientGameObject.id];
    delete this.savedState[clientGameObject.id];
    if (quit) {
      console.log("aoi remove");
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(messageType.aoiremove, {
            id: clientGameObject.id,
          });
        }
      }
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
   * Broadcast to all adjacent and current clients within AOI
   * @param msgtype used type from messageType from globalConfig
   * @param msg
   */
  broadcast(msgtype, msg) {
    // check if object is empty then don't broadcast
    if (!(Object.keys(msg).length === 0 && msg.constructor === Object)) {
      for (const clientid in this.clients) {
        const state = this.entities[clientid].getInternalState();
        if (!state.asleep) {
          this.clients[clientid].send(msgtype, msg);
        }
      }
      // broadcast to adjacent aoi
      for (const clientid in this.adjacentClient) {
        const state = this.adjacentPlayer[clientid].getInternalState();
        if (!state.asleep) {
          this.adjacentClient[clientid].send(msgtype, msg);
        }
      }
    }
  }
  /**
   * @description get all entity within AOI that have changed state
   * @returns {array} of all state within aoi
   */
  getAOIEntities() {
    const entities = {};
    for (const id in this.entities) {
      const newState = this.entities[id].getState();
      if (JSON.stringify(newState) !== JSON.stringify(this.savedState[id])) {
        entities[id] = newState;
      }
      this.savedState[id] = newState;
    }
    return entities;
  }
}
