# Dungeon.IO 
Multiplayer Dungeon IO game

Deployed at: https://multiplayer-game-ce0a5f80aba5.herokuapp.com/

## Overview

Multiplayer IO game built on Node.JS, colyseus.JS, and Phaser

colyseus.JS is networking library used for communicating between client and server built ontop of websocket protocol

Phaser is the client side game engine used to render graphics



## Roadmap

Completed features
 - Basic Movement 
 - Authorative Servers 
 - Client Side prediction (completed but very buggy scrapped for future development)
 - Server timestep / Entity Interplation / Time Synchronization
 - interest management
 
Currently Working On
 - Combat System

Planned Features 
 - Basic User Interface
 - Basic AI 
 - Equipment system (weapons)
    - daggers, bows, spears
    
## Setup

```
npm install

npm start
```

## Deploying Code
The staging branch of this github repository is linked to heroku app located https://game-dungeonio-test.herokuapp.com/ whenever you push to the staging branch it will be automatically deployed on the app. 

