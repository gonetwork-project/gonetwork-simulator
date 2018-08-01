import * as React from 'react'
import { View, Text, Button } from 'react-native'

import { clearStorage } from '../logic/utils'
import { restart } from '../global'

export class Main extends React.Component {

  render () {
    return <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dev Actions</Text>

      <View style={{ padding: 20, flexDirection: 'row' }}>
        <Button onPress={clearStorage} title='Clear-Cache' />
        <Button onPress={restart} title='Restart' />
      </View>

    </View>
  }
}
