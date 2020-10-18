# Dungeon.IO 
Multiplayer Dungeon IO game


## Overview

Multiplayer IO game built on Node.JS, colyseus.JS, and Phaser

colyseus.JS is networking library used for communicating between client and server built ontop of websocket protocol

Phaser is the client side game engine used to render graphics



## Roadmap

Completed features
 - Basic Movement 
 - Authorative Servers 
 - Client Side prediction

Planned Features 
 - Server timestep / Entity Interplation / Time Synchronization
 - interest management (probably not possible with colyseus.JS)
 - Basic User Interface
 - Basic AI 
 - Equipment system (weapons)
    - daggers, bows, spears
    
## Setup

To setup the development environment 

cd phaser3-project-template 

npm install 

cd client 

npm install 

cd .. 

npm run start 

cd client 

npm run start 

--------------------------------------------------------------------

game instance runs on localhost
colyseus monitoring portal instance runs on localhost/colyseus

To setup production environment 

set NODE_ENV to production

cd phaser3-project-template 

npm install 

cd client 

npm install 

npm run build  

cd .. 

npm run start 



## Phaser 3 Template

Created from phaser3 project template

A Phaser 3 project template with ES6 support via [Babel 7](https://babeljs.io/) and [Webpack 4](https://webpack.js.org/)
that includes hot-reloading for development and production-ready builds.

Loading images via JavaScript module `import` is also supported.

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

In client folder
| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm start` | Build project and open web server running project |
| `npm run build` | Builds code bundle with production settings (minification, uglification, etc..) |

In root folder
| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run start` | Run server code |
| `npm run dev` | Runs development server code |
| `npm run postinstall`| cd into client folder and runs a build |


## Customizing Template

### Babel
You can write modern ES6+ JavaScript and Babel will transpile it to a version of JavaScript that you
want your project to support. The targeted browsers are set in the `.babelrc` file and the default currently
targets all browsers with total usage over "0.25%" but excludes IE11 and Opera Mini.

  ```
  "browsers": [
    ">0.25%",
    "not ie 11",
    "not op_mini all"
  ]
  ```

### Webpack
If you want to customize your build, such as adding a new webpack loader or plugin (i.e. for loading CSS or fonts), you can
modify the `webpack/base.js` file for cross-project changes, or you can modify and/or create
new configuration files and target them in specific npm tasks inside of `package.json'.

## Deploying Code
The staging branch of this github repository is linked to heroku app located https://game-dungeonio-test.herokuapp.com/ whenever you push to the staging branch it will be automatically deployed on the app. 

