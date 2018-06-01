import * as React from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'

import PrivateKeysDemo from './screens/DepsDemo'
import Wallet from './screens/Wallet'

export default class App extends React.Component {
  render () {
    return <View style={{ paddingTop: 50, paddingLeft: 20 }}>
      <Wallet />
      {/* <PrivateKeysDemo /> */}
    </View>
  }
}
