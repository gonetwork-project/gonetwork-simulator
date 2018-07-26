import * as React from 'react'
import { View, Text, TextInput, Button, Alert } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'

import * as c from '../logic/config'
import { Subscription } from 'rxjs'

type State = c.Combined & { error: boolean }

const StepHeader = (p: { text: string }) =>
  <Text style={{ marginTop: 24, fontSize: 24, fontWeight: 'bold', flexDirection: 'row' }}>
    {p.text}
  </Text>

export default class Config extends React.Component<{}, State> {
  sub!: Subscription

  componentDidMount () {
    this.sub = c.combined
      .do(c => this.setState(c))
      .merge(c.error
        .map(e => !!e)
        .do(() => this.setState({ error: false }))
        .delay(250)
        .do(e => this.setState({ error: e }))
      )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    if (ev.data.includes('gonetworkServer')) {
      c.setServerUrl(JSON.parse(ev.data).gonetworkServer)
    }
  }

  render () {
    if (!this.state) return null
    const { url, config, error } = this.state
    console.log(url)
    return <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', flexDirection: 'row' }}>
        Configuration
      </Text>

      <StepHeader text='start services' />
      <Text>TODO: (link to) instructions or/and (link to) video </Text>

      <StepHeader text='provide main service url' />
      <Text>You can scan qr code or provide it manually</Text>
      <View style={{ flexDirection: 'row', padding: 8 }}>
        <Text>http://</Text>
        <TextInput
          style={{ width: 220, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          value={url.hostname}
          keyboardType='numeric'
          placeholder='hostname, eg. 192.168.1.xx'
          onChangeText={t => c.setServerUrl({ hostname: t })}
        />
        <Text>:</Text>
        <TextInput
          style={{ width: 100, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          keyboardType='number-pad'
          placeholder='port, eg. 5215'
          maxLength={6}
          value={(url.port as any) && `${url.port}`}
          onChangeText={t => c.setServerUrl({ port: parseInt(t, 10) })}
        />
        {error && <Text style={{ color: 'red' }}>Cannot connect</Text>}
        {config && <Text style={{ color: 'green' }}>OK</Text>}
      </View>

      {
        !config && <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          onBarCodeRead={this.onScan}
          style={{ width: 300, height: 300 }} />
      }

    </View>
  }
}
