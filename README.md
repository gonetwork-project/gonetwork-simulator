# Overview

A simulator application for presenting inner working of [GoNetwork framework](https://github.com/gonetwork-project/gonetwork-framework/)

# Develop

Once:

1. `git clone git@github.com:gonetwork-project/gonetwork-simulator.git`
2. `cd gonetwork-simulator`
3. `npm install`

Simulator server:
 
(run in parallel)
 - `yarn server-compile --watch`
 - `cd build/server && nodemon . with-ip` (wait until `build/server` recreated)

 Application itself:

(run in parallel)
 - `yarn app-watch`
 - `react-native start`