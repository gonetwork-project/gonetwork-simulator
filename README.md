:warning: **The simulator has educational / demonstrational purpose - do not use it in production or to transfer real tokens.** :warning:

# Overview

A simulator application for presenting inner working of [GoNetwork Framework](https://github.com/gonetwork-project/gonetwork-framework/).

The simulator demonstrates:
  - how to perform on-chain actions related to opening, managing and closing netting channels
  - how to perform off-chain directed and mediated transfers
  - off-chain communication and peer-to-peer protocol

The simulator depends on the coordinator server, which is part of this repo. The coordinator server allows to run isolated and self contained sessions. Each sessions has its own mocked and initialized blockchain network and a mocked mqtt server. When session ends all resources are disposed. If needed, the coordinator server could be exposed on a public ip address, but its primary usage is local / local network.

# Run

## Do once:

1. `git clone git@github.com:gonetwork-project/gonetwork-simulator.git`
2. `cd gonetwork-simulator`
3. `npm install`

Most of the code is written in Typescript and requires compilation step. Please mind that there is a `postintall` script which compiles all the code upon `npm install`.

## Simulator application:

Commands:
 - (only if code changed) `npm run vis-compile` (visualization is a web page embedded in react native via `WebView`; technically it is a separate sub-project)
 - (only if code changed) `npm run app-compile`
 - `node_modules/.bin/react-native start`

Open `[simulator-root]/ios` in Xcode. If you use Xcode in version 10 (or higher) switch to legacy build - `File > Project Settings... > Build System`. More info: [this issue](https://github.com/gonetwork-project/gonetwork-simulator/issues/9).


## Coordination server:

Commands:
- (only if code changed) `npm run server-compile`
- `node build/server`

Before first run we need to create blockchain snapshot with smart contracts deployed and initial tokens distributed. It speeds up substantially starting all new sessions later. The coordinator server will check if the snapshot is present and if not, will create it in a blocking manner. Because of that the first start of the server may take up to 60 seconds. 
To manually create the snapshot please run `yarn server-compile && node build/server/create-snapshot.js`.
 
# Develop

Analogous to `Run`, but most commands should be run in a watch mode - either via `--watch` flags or `nodemon`. Please take a look at `package.json` for inspiration or contact us if need some help.