import * as React from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'

import Config from './screens/Config'

export default class App extends React.Component {
  render () {
    return <View style={{ paddingTop: 50, paddingLeft: 20 }}>
      <Config />
    </View>
  }
}
