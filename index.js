import './global'

import { AppRegistry } from 'react-native'
import App from './lib/App'

// require('./src/old-test') broken as old state channel is used
// require('./lib/monitoring-test')

AppRegistry.registerComponent('TestApp', () => App)
