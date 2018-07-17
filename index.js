import './global'

import { AppRegistry } from 'react-native'
// import App from './lib/App'
import IntegrationTest from './lib/integration-tests'

// require('./src/old-test') broken as old state channel is used
// require('./lib/monitoring-test')

// AppRegistry.registerComponent('TestApp', () => App)
AppRegistry.registerComponent('TestApp', () => IntegrationTest)
