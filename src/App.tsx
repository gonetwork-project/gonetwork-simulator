import * as React from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'

import PrivateKeysDemo from './screens/PrivateKeysDemo'

export default class App extends React.Component {
  render () {
    return <View style={{ paddingTop: 50, paddingLeft: 20 }}>
      <PrivateKeysDemo />
    </View>
  }
}
