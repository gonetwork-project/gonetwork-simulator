# How to run

## Prerequisites

 1. `npm install -g react-native-cli`.
 2. Clone repo and `npm install`.
 
## Dev

[React Native dev tools docs](https://facebook.github.io/react-native/docs/debugging.html)

In parallel:
 1. **IMPORTANT** Run `npm run watch` - it deletes `./lib` and then compiles `./src` (TS) to `./lib` (JS) and watches for changes.
 2. Run `react-native start` - it servers JS files and other app assets.

## On iOS simulator

Needs to be done once, unless native modules has changed. Later you just need to open simulator on which it was installed. 

Option 1:
`react-native run-ios` (_feels_ bit longer)

Option 2:  
 1. In XCode open `./ios`.
 2. Select simulator.
 3. Top left corner hit triangle icon.
 4. Once successfully built and run XCode may be closed.

Be aware that both options will start react-native server unless one is running on a default port.
Once installed the application should start automatically, connect to react-native server and download JS code.

On a fresh start it may take a while to bundle the app. The progress should be visible both in the app and the react-native process.
For later changes only delta is being servered.

If you see red error page: try to press `reload` button at the bottom of the screen.
If does not help make sure you are running `react-native start` - otherwise paste the error / its image on slack.
