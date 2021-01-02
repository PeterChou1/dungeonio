import { messageType } from "../../common";
import { Player } from "../game.v2/player";
import { AOI } from "./aoi";


export class AOImanager {
  static directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  height: number;
  width: number;
  aoiwidth: number;
  aoiheight: number;
  aoi: Array<Array<AOI>>;
  constructor() {
    //TODO: hardcoded for now make it dynamic later
    this.height = 800;
    this.width = 3200;
    //TODO: area of interest will by dynamically adjusted to be half of viewport
    this.aoiwidth = 512;
    this.aoiheight = 768;
    // partition a matterjs world into AOI (areas of interest)
    this.aoi = [];
    var x = 0;
    var y = 0;
    var idx = 0;
    var idy = 0;
    while (x < this.width) {
      idy = 0;
      var row = [];
      while (y < this.height) {
        row.push(
          new AOI(this.aoiwidth, this.aoiheight, x, y, { x: idx, y: idy })
        );
        y += this.aoiheight;
        idy++;
      }
      y = 0;
      x += this.aoiwidth;
      idx++;
      this.aoi.push(row);
    }
  }

  aoiinit(gameobject) {
    const coords = gameobject.getPosition();
    for (const row of this.aoi) {
      for (const aoi of row) {
        if (aoi.inAOI(coords.x, coords.y)) {
          //check condition for gameobject to be a player
          if (gameobject instanceof Player) {
            aoi.addClient(gameobject, true);
            const adjacentAOI = this.getAdjacentAOI(aoi.aoiId);
            for (const adjaoi of adjacentAOI) {
              adjaoi.addAdjacentClient(gameobject, false);
            }
          } else {
            aoi.addEntity(gameobject);
          }
          //console.log(aoi.aoiId);
          return aoi.aoiId;
        }
      }
    }
  }
  /**
   * @description given gameobject place it in the correct AOI
   * if gameobject is already in an AOI remove it from current AOI and
   * place in updated AOI
   * if gameobject is in two AOI simultaneously than return the current
   * AOI
   * @param gameobject
   * @returns id of AOI player belongs to
   */
  aoiupdate(gameobject): { x: number; y: number } {
    const coords = gameobject.getPosition();
    if (gameobject.aoiId) {
      const aoiId = gameobject.aoiId;
      const adjacent = this.getAdjacentAOI(gameobject.aoiId);
      const currentAOI = this.aoi[aoiId.x][aoiId.y];
      if (currentAOI.inAOI(coords.x, coords.y)) {
        return gameobject.aoiId;
      } else {
        for (const aoi of adjacent) {
          if (aoi.inAOI(coords.x, coords.y)) {
            if (gameobject instanceof Player) {
              aoi.removeAdjacentClient(gameobject, true);
              aoi.addClient(gameobject);
              currentAOI.removeClient(gameobject);
              currentAOI.addAdjacentClient(gameobject, true);
              const newadjacent = this.getAdjacentAOI(aoi.aoiId);
              for (const oldaoi of adjacent) {
                if (!newadjacent.includes(oldaoi) && oldaoi !== aoi) {
                  oldaoi.removeAdjacentClient(gameobject, false);
                }
              }
              for (const newaoi of newadjacent) {
                if (!adjacent.includes(newaoi) && newaoi !== currentAOI) {
                  newaoi.addAdjacentClient(gameobject, false);
                }
              }
            } else {
              aoi.addEntity(gameobject);
              currentAOI.removeEntity(gameobject);
            }
            return aoi.aoiId;
          }
        }
        // if player is in no aoi then remove gameobject from every adjacent square
        for (const aoi of adjacent) {
          aoi.removeAdjacentClient(gameobject, false);
        }
        if (gameobject instanceof Player) {
          currentAOI.removeClient(gameobject, true);
        } else {
          currentAOI.removeEntity(gameobject);
        }
      }
    }
  }
  /**
   * @description scans every aoi and broadcast updates to their respective clients
   */
  aoibroadcast() {
    for (const row of this.aoi) {
      for (const aoiCell of row) {
        aoiCell.broadcast(messageType.aoiupdate, aoiCell.getAOIEntities());;
      }
    }
  }

  getAOI(id: { x: number; y: number }) {
    return this.aoi[id.x][id.y];
  }

  /**
   * @description given an AOI id give an array of adjacent AOIs
   * @param {x: number, y: number} id
   */
  getAdjacentAOI(id: { x: number; y: number }): Array<AOI> {
    const adjacent = [];
    for (const direction of AOImanager.directions) {
      const x = id.x + direction[0];
      const y = id.y + direction[1];
      if (0 <= x && x < this.aoi.length && 0 <= y && y < this.aoi[0].length) {
        adjacent.push(this.aoi[x][y]);
      }
    }
    return adjacent;
  }
}
