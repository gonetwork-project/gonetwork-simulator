/*
* @Author: amitshah
* @Date:   2018-04-18 00:32:59
* @Last Modified by:   amitshah
* @Last Modified time: 2018-04-18 02:24:08
*/

global.Buffer = require('buffer').Buffer;
global.process = require('process');

import { AppRegistry } from 'react-native';
import App from './src/App';

// require('./src/old-test') broken as old state channel is used
require('./src/monitoring-test')

AppRegistry.registerComponent('TestApp', () => App);
