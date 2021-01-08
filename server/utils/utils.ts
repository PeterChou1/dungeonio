

interface Action {
  callback: (...args) => any | void;
  args: Array<any>;
}

export const registerCollisionCallback = (body) => {
  body.onCollide = function (cb) {
    body._mceOC = cb;
  };
  body.onCollideEnd = function (cb) {
    body._mceOCE = cb;
  };
  body.onCollideActive = function (cb) {
    body._mceOCA = cb;
  };
  return body;
}


export class ActionQueue {
  items: Array<Action>;

  constructor() {
    this.items = [];
  }

  isEmpty() {
    // return true if the queue is empty.
    return this.items.length == 0;
  }

  enqueue(element: Action) {
    // adding element to the queue
    this.items.push(element);
  }

  dequeue(): Action {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  executeActions() {
    //console.log('executing actions');
    while (!this.isEmpty()) {
      const { callback, args } = this.dequeue();
      console.log("execute action with args ", args);
      //console.log('with context ', context)
      callback(...args);
    }
  }
}

export function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Takes the given string and pads it out, to the length required, using the character
 * specified. For example if you need a string to be 6 characters long, you can call:
 *
 * `pad('bob', 6, '-', 2)`
 *
 * This would return: `bob---` as it has padded it out to 6 characters, using the `-` on the right.
 *
 * You can also use it to pad numbers (they are always returned as strings):
 * 
 * `pad(512, 6, '0', 1)`
 *
 * Would return: `000512` with the string padded to the left.
 *
 * If you don't specify a direction it'll pad to both sides:
 * 
 * `pad('c64', 7, '*')`
 *
 * Would return: `**c64**`
 *
 * @function Phaser.Utils.String.Pad
 * @since 3.0.0
 *
 * @param {string|number|object} str - The target string. `toString()` will be called on the string, which means you can also pass in common data types like numbers.
 * @param {number} [len=0] - The number of characters to be added.
 * @param {string} [pad=" "] - The string to pad it out with (defaults to a space).
 * @param {number} [dir=3] - The direction dir = 1 (left), 2 (right), 3 (both).
 * 
 * @return {string} The padded string.
 */
var Pad = function (str, len, pad, dir)
{
    if (len === undefined) { len = 0; }
    if (pad === undefined) { pad = ' '; }
    if (dir === undefined) { dir = 3; }

    str = str.toString();

    var padlen = 0;

    if (len + 1 >= str.length)
    {
        switch (dir)
        {
            case 1:
                str = new Array(len + 1 - str.length).join(pad) + str;
                break;

            case 3:
                var right = Math.ceil((padlen = len - str.length) / 2);
                var left = padlen - right;
                str = new Array(left + 1).join(pad) + str + new Array(right + 1).join(pad);
                break;

            default:
                str = str + new Array(len + 1 - str.length).join(pad);
                break;
        }
    }

    return str;
};
var GetValue = function (source, key, defaultValue)
{
    if (!source || typeof source === 'number')
    {
        return defaultValue;
    }
    else if (source.hasOwnProperty(key))
    {
        return source[key];
    }
    else if (key.indexOf('.') !== -1)
    {
        var keys = key.split('.');
        var parent = source;
        var value = defaultValue;

        //  Use for loop here so we can break early
        for (var i = 0; i < keys.length; i++)
        {
            if (parent.hasOwnProperty(keys[i]))
            {
                //  Yes it has a key property, let's carry on down
                value = parent[keys[i]];

                parent = parent[keys[i]];
            }
            else
            {
                //  Can't go any further, so reset to default
                value = defaultValue;
                break;
            }
        }

        return value;
    }
    else
    {
        return defaultValue;
    }
};

/**
 * Create an array representing the range of numbers (usually integers), between, and inclusive of,
 * the given `start` and `end` arguments. For example:
 *
 * `var array = Phaser.Utils.Array.NumberArray(2, 4); // array = [2, 3, 4]`
 * `var array = Phaser.Utils.Array.NumberArray(0, 9); // array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`
 * `var array = Phaser.Utils.Array.NumberArray(8, 2); // array = [8, 7, 6, 5, 4, 3, 2]`
 *
 * This is equivalent to `Phaser.Utils.Array.NumberArrayStep(start, end, 1)`.
 *
 * You can optionally provide a prefix and / or suffix string. If given the array will contain
 * strings, not integers. For example:
 *
 * `var array = Phaser.Utils.Array.NumberArray(1, 4, 'Level '); // array = ["Level 1", "Level 2", "Level 3", "Level 4"]`
 * `var array = Phaser.Utils.Array.NumberArray(5, 7, 'HD-', '.png'); // array = ["HD-5.png", "HD-6.png", "HD-7.png"]`
 *
 * @function Phaser.Utils.Array.NumberArray
 * @since 3.0.0
 *
 * @param {number} start - The minimum value the array starts with.
 * @param {number} end - The maximum value the array contains.
 * @param {string} [prefix] - Optional prefix to place before the number. If provided the array will contain strings, not integers.
 * @param {string} [suffix] - Optional suffix to place after the number. If provided the array will contain strings, not integers.
 *
 * @return {(number[]|string[])} The array of number values, or strings if a prefix or suffix was provided.
 */
var NumberArray = function (start, end, prefix?, suffix?)
{
    var result = [];

    var i;
    var asString = false;

    if (prefix || suffix)
    {
        asString = true;

        if (!prefix)
        {
            prefix = '';
        }

        if (!suffix)
        {
            suffix = '';
        }
    }

    if (end < start)
    {
        for (i = start; i >= end; i--)
        {
            if (asString)
            {
                result.push(prefix + i.toString() + suffix);
            }
            else
            {
                result.push(i);
            }
        }
    }
    else
    {
        for (i = start; i <= end; i++)
        {
            if (asString)
            {
                result.push(prefix + i.toString() + suffix);
            }
            else
            {
                result.push(i);
            }
        }
    }

    return result;
};

/**
 * @description generates frame data from player animations configurations
 * @param frameinfo 
 */
export const generateFrameTiming = (frameinfo) => {
  // copy frame info to ensure no mutation non sense
  const copy = JSON.parse(JSON.stringify(frameinfo));
  const frametiming = {};
  for (const anim of copy) {
    const frames = generateFrameNames(anim.frames[1]).reverse();
    console.log(frames);
    frametiming[anim.key] = {
      frames: frames,
      interval: 1000 / anim.frameRate,
      duration: (frames.length * 1000) / anim.frameRate,
      repeat: anim.repeat,
    };
  }
  return frametiming;
}

export const generateFrameNames = (config) : Array<String> => {
  var prefix = GetValue(config, 'prefix', '');
  var start = GetValue(config, 'start', 0);
  var end = GetValue(config, 'end', 0);
  var suffix = GetValue(config, 'suffix', '');
  var zeroPad = GetValue(config, 'zeroPad', 0);
  var out = GetValue(config, 'outputArray', []);
  var frames = GetValue(config, 'frames', false);
  if (!frames) {
    frames = NumberArray(start, end);
  }
  for (var i = 0; i < frames.length; i++)
  {
      var frame = prefix + Pad(frames[i], zeroPad, '0', 1) + suffix;
      out.push(frame);
  }
  return out;
};
