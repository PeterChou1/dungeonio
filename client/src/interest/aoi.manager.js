
class AOIClient {
    constructor(width, height, x, y, id) {
        this.aoiId = id;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
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


    constructor(player, height, width) {
        this.player = player;
        this.height = height;
        this.width = width;
        this.aoiwidth = 512;
        this.aoiheight = 768;
        this.aoi = [];
        this.activeaoi = {};
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

    /**
     * @description returns which aoi the gameobject belongs to
     * @param {*} gameobject 
     */
    aoiplace(gameobject) {
        const coords = gameobject.getPosition();
        for (const row of this.aoi) {
            for (const aoi of row) {
                if (aoi.inAOI(coords.x, coords.y)) {
                    return aoi.aoiId;
                }
            }
        }
    }

    /**
     * @description 
     * @param {*} gameobject 
     */
    aoiupdate(gameobject) {

        const coords = gameobject.getPosition();
        const aoiId = gameobject.aoiId;
        const adjacent = this.getAdjacentAOI(gameobject.aoiId);
        const currentAOI = this.aoi[aoiId.x][aoiId.y];

        if (!currentAOI.inAOI(coords.x, coords.y)) {

            for (const aoi of adjacent) {
                if (aoi.inAOI(coords.x, coords.y)) {
                    
                }
            }
        }
        for (const row in this.aoi) {

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