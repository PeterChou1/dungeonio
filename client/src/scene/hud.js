import { HealthBar } from "../ui/healthbar";
import { frontEndEvent } from "../../../common";
export class hudScene extends Phaser.Scene {
  

  init (data) {
    this.playername = data.playerName;
    this.key = data.key;
  }

  constructor() {
    super({
      key: "hudScene",
    });
    // placement of ui
    this.coords = {
      name : { x: 48, y: 25 },
      bar : { x : 48, y: 50, width : 200 }
    }
    // stats ui is keeping track of
    this.stats = {

    }
  }

  create() {
    console.log('launch hud scene');
    const map = this.add.tilemap("uimap");
    const uiImageset = map.addTilesetImage("Interface", "Interface");
    map.createStaticLayer("ui", uiImageset, 0, 0);
    this.bar = new HealthBar(this, this.coords.bar.x, this.coords.bar.y, this.coords.bar.width, 0.5);   
    this.playertext = this.add.text(this.coords.name.x, this.coords.name.y, this.playername)
                              .setStyle({
                                'fontFamily' : 'uifont',
                                'fontSize': '12px',
                                'color': 'black',
                                'fontWeight': 'bold'
                              });
    
    this.scene.get(this.key).events.on(frontEndEvent.uiupdate, (updates) => {
      const {maxhealth, health} = updates;
      this.bar.animateToFill(health / maxhealth);
    })


  }

}
