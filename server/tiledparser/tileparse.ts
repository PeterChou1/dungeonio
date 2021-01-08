import Phaser from "phaser";
import { Vertices, Bodies, Body, World } from "matter-js";
import { collisionData } from "../../common";
import decomp from 'poly-decomp';
declare let window;
window.decomp = decomp;

interface layermap {
    [layername : string] : string,
}
/** 
 * @description used matterjs to parse tiled parser to create world
 * @param engine matter js engine
 * @param json tiled json
 * @param layername names of the layers to convert to be send to matterjs worlds
 * @return object groups in each category
 */
export function parsetiled(engine, json, layermap : layermap, objectlayer? : Array<string>) {
    const objectgroup = {
        soft: []
    }
    //debugger;
    const map = Phaser.Tilemaps.Parsers.Tiled.ParseJSONTiled("map", json, false);
    if (!(map.layers instanceof Phaser.Tilemaps.ObjectLayer)) {
        map.layers.forEach( layer => {
            const layername = Object.keys(layermap);
            if (layername.includes(layer.name)) {
                for (const row of layer.data) {
                    for (const tile of row) {
                        if (tile.properties.collides) {

                            var tileset = map.tilesets.find( tileset => tileset.name === layermap[layer.name]);
                            var body;
                            if (tile.properties.soft) {
                                body = parsedTileBody(tile, tileset, {
                                    collisionFilter : {
                                        category : collisionData.category.soft
                                    }
                                });
                            } else {
                                body = parsedTileBody(tile, tileset, {
                                    collisionFilter : {
                                        category : collisionData.category.hard
                                    }
                                })
                            }
                            World.addBody(engine.world, body);
                        }
                    }
                }
            }
        })
    };
    if (Array.isArray(map.objects) && Array.isArray(objectlayer)) {
        map.objects.forEach(
            layer => {
                if (objectlayer.includes(layer.name)) {
                    for (const rect of layer.objects) {
                        const sensorobject = Bodies.rectangle(
                            rect.x + rect.width / 2,
                            rect.y + rect.height / 2,
                            rect.width,
                            rect.height,
                            {
                              isSensor: true, // It shouldn't physically interact with
                              isStatic: true, // It shouldn't move
                            }
                          );
                          objectgroup.soft.push(sensorobject);
                          World.addBody(engine.world, sensorobject);
                    }
                }
            }
        )
    }
    return objectgroup;
}

var GetFastValue = function (source, key, defaultValue)
{
    var t = typeof(source);

    if (!source || t === 'number' || t === 'string')
    {
        return defaultValue;
    }
    else if (source.hasOwnProperty(key) && source[key] !== undefined)
    {
        return source[key];
    }
    else
    {
        return defaultValue;
    }
};


/**
 * @description parses tile
 * @param tile 
 * @param tileset tileset tile is part of
 * @param opt optional matterjs configurations
 * @returns tile body to be added
 */
function parsedTileBody(tile : Phaser.Tilemaps.Tile, tileset? : Phaser.Tilemaps.Tileset, opt?) {
    var collisionGroup;
    if (tileset) {
        collisionGroup = tileset.getTileCollisionGroup(tile.index);
    } else {
        collisionGroup = tile.getCollisionGroup();
    }
    var collisionObjects = GetFastValue(collisionGroup, 'objects', []);
    var options = Object.assign(opt, { isStatic : true });
    if (collisionObjects.length > 0) {
        //TODO: might not scale later
        var sx = 1;//tile.tilemapLayer.scaleX;
        var sy = 1;//tile.tilemapLayer.scaleY;
        var tileX = tile.getLeft();
        var tileY = tile.getTop();
        var parts = [];

        for (var i = 0; i < collisionObjects.length; i++)
        {
            var object = collisionObjects[i];
            var ox = tileX + (object.x * sx);
            var oy = tileY + (object.y * sy);
            var ow = object.width * sx;
            var oh = object.height * sy;
            var body = null;

            if (object.rectangle)
            {
                body = Bodies.rectangle(ox + ow / 2, oy + oh / 2, ow, oh, options);
            }
            else if (object.ellipse)
            {
                body = Bodies.circle(ox + ow / 2, oy + oh / 2, ow / 2, options);
            }
            else if (object.polygon || object.polyline)
            {
                // Polygons and polylines are both treated as closed polygons
                var originalPoints = object.polygon ? object.polygon : object.polyline;

                var points = originalPoints.map(function (p)
                {
                    return { x: p.x * sx, y: p.y * sy };
                });

                var vertices = Vertices.create(points);

                // Points are relative to the object's origin (first point placed in Tiled), but
                // matter expects points to be relative to the center of mass. This only applies to
                // convex shapes. When a concave shape is decomposed, multiple parts are created and
                // the individual parts are positioned relative to (ox, oy).
                //
                //  Update: 8th January 2019 - the latest version of Matter needs the Vertices adjusted,
                //  regardless if convex or concave.

                var center = Vertices.centre(vertices);
                ox += center.x;
                oy += center.y;
                body = Bodies.fromVertices(ox, oy, vertices, options);
            }

            if (body)
            {
                parts.push(body);
            }
        }

        if (parts.length === 1)
        {
            return parts[0];
        }
        else if (parts.length > 1)
        {
            options['parts'] = parts;
            return Body.create(options);
        }
    } else {
        var bounds = tile.getBounds();
        if (bounds instanceof Phaser.Geom.Rectangle) {
            var cx = bounds.x + (bounds.width / 2);
            var cy = bounds.y + (bounds.height / 2);
            return Bodies.rectangle(cx, cy, bounds.width, bounds.height, options);
        }
    }

}