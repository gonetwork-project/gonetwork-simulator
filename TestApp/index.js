import { AppRegistry } from 'react-native'
import App from './src/App'

// require('./src/old-test') broken as old state channel is used
require('./src/monitoring-test')

AppRegistry.registerComponent('TestApp', () => App)
