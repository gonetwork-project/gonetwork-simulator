import * as React from 'react'
import { View, Text } from 'react-native'

export default class Config extends React.Component<{}, any> {

  render () {
    return <View>
      <Text style={{ marginTop: 46, marginLeft: 32, fontSize: 24, fontWeight: 'bold' }}>Config</Text>
    </View>
  }
}
