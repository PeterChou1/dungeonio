class AOIClient {
  constructor(width, height, x, y, id) {
    this.id = id;
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
}

/**
 * @description client side interest management remove
 * class is reponsible for removing all game object not in players view
 */
export class AOImanagerClient {
  constructor(height, width) {
    this.directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    this.mainplayer = null;
    this.height = height;
    this.width = width;
    this.aoiwidth = 512;
    this.aoiheight = 768;
    this.aoi = [];
    // aoi main player is in
    this.activeaoi = [];
    var x = 0;
    var y = 0;
    var idx = 0;
    var idy = 0;
    while (x < this.width) {
      idy = 0;
      var row = [];
      while (y < this.height) {
        row.push(
          new AOIClient(this.aoiwidth, this.aoiheight, x, y, { x: idx, y: idy })
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

  setMain(main) {
    this.mainplayer = main;
    this.aoiupdate(main);
  }

  /**
   * @description sets aoi object belong to return true if
   * its within bounds of the game false otherwise
   * @param {*} gameobject
   */
  aoiplace(gameobject) {
    const coords = gameobject.getPosition();
    for (const row of this.aoi) {
      for (const aoi of row) {
        if (aoi.inAOI(coords.x, coords.y)) {
          gameobject.setAOIid(aoi.id);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @description places gameobject in aoi deactivates them if they are not active
   * @param {*} gameobject
   */
  aoiupdate(gameobject) {
    const inbounds = this.aoiplace(gameobject);
    if (this.mainplayer && inbounds) {
      const coords = gameobject.getPosition();
      if (gameobject === this.mainplayer) {
        const id = gameobject.getAOIid();
        const currentAOI = this.aoi[id.x][id.y];
        this.activeaoi = [];
        this.activeaoi.push(currentAOI, ...this.getAdjacentAOI(id));
      } else {
        //debugger;
        const inActive = this.activeaoi.reduce((inaoi, aoi) => {
          return aoi.inAOI(coords.x, coords.y) || inaoi;
        }, false);
        if (!inActive) {
          //console.log(`${gameobject.playerName} set asleep through aoi update`);
          //this.activeaoi.forEach(aoi => console.log(`current active aoi ${aoi.id}`))
          gameobject.setAsleep();
        }
      }
    }
  }

  getAdjacentAOI(id) {
    const adjacent = [];
    for (const direction of this.directions) {
      const x = id.x + direction[0];
      const y = id.y + direction[1];
      if (0 <= x && x < this.aoi.length && 0 <= y && y < this.aoi[0].length) {
        adjacent.push(this.aoi[x][y]);
      }
    }
    return adjacent;
  }
}
