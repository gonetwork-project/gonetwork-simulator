global.Buffer = require('buffer').Buffer;
global.process = require('process');

import { AppRegistry } from 'react-native';
import App from './App';

const state = require('state-channel');

AppRegistry.registerComponent('TestApp', () => App);
