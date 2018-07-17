import * as React from 'react'
import { View, Text } from 'react-native'

import { setupClient } from './setup'

const c1 = setupClient(0)

console.log(c1)

c1.blockchain.rpc.blockNumber()
  .then(bn => console.log(bn, 'BN'))

export default class IntegrationTest extends React.Component {

  render () {
    return <View style={{ paddingTop: 56 }}>
      <Text>Integration Test</Text>
      </View>
  }
}
