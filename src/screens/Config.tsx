import * as React from 'react'
import { View, Text, TextInput } from 'react-native'

import * as c from '../logic/config'
import { Subscription } from 'rxjs'

type State = Partial<c.Combined>

export default class Config extends React.Component<{}, State> {
  sub!: Subscription
  state: State = {}

  componentDidMount () {
    this.sub = c.combined
      .do(c => this.setState(c))
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  render () {
    console.log('STATE', this.state)
    const { url, config, error } = this.state
    return <View>
      <Text style={{ marginTop: 46, marginLeft: 32, fontSize: 24, fontWeight: 'bold' }}>Config</Text>
      <Text>Server Url:</Text>
      <TextInput
        style={{ width: 300, height: 40, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
        value={url}
        onChangeText={c.setServerUrl}
      />
    </View>
  }
}
