import Phaser from 'phaser';


class Circle extends Phaser.Physics.Matter.Image {
    constructor(world, x, y, width, scale, collides){
        super(world, x, y, '')
        this.setCircle(width / 2, {restutitution: 1, friction: 0.25});
        this.setScale(scale);
        this.setCollidesWith(collides)
    }
}