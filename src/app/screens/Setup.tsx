import * as React from 'react'
import { View, Text, TextInput, Button, AsyncStorage, Switch } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'
import { Subscription, Observable } from 'rxjs'

import { setUnknownError } from '../global'
import * as setup from '../logic/setup'

type State = { url: setup.Url, connection: setup.ConnectionWithStatus, cryptoInited?: boolean, autoContinue: boolean }
interface Props {
  onDone: () => void
}

const StepHeader = (p: { text: string }) =>
  <Text style={{ marginTop: 24, fontSize: 24, fontWeight: 'bold', flexDirection: 'row' }}>
    {p.text}
  </Text>

export class Setup extends React.Component<Props, State> {
  sub!: Subscription

  componentDidMount () {
    this.sub = (Observable.merge(
      setup.url.map(u => ({ url: u })),
      setup.connectionWithStatus.map(c => ({ connection: c }))
    ) as Observable<State>)
      .do(c => this.setState(c))
      // uncomment to imitate runtime exception
      // .merge(Observable.timer(2000).mergeMapTo(Observable.throw('runtime-error')))
      .subscribe({ error: setUnknownError })
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    if (ev.data.includes('gonetworkServer')) {
      setup.setUrl(JSON.parse(ev.data).gonetworkServer)
    }
  }

  renderCamera = () =>
    <RNCamera
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      onBarCodeRead={this.onScan}
      style={{ width: 300, height: 300 }} />

  render () {
    if (!this.state) return null
    const { url, connection } = this.state
    const isConnected = connection && !!(connection as WebSocket).onopen
    return <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', flexDirection: 'row' }}>
        Setup
      </Text>

      <StepHeader text='start services' />
      <Text>TODO: (link to) instructions or/and (link to) video </Text>

      <StepHeader text='Please, provide simulator server url' />
      {connection === 'failed' && <Text style={{ color: 'red' }}>Cannot connect</Text>}
      {connection === 'connecting' && <Text>...connecting...</Text>}
      {isConnected && <Text style={{ color: 'green' }}>OK</Text>}
      <Text>You can scan qr code or provide it manually</Text>
      <View style={{ flexDirection: 'row', padding: 8 }}>
        <Text>ws://</Text>
        <TextInput
          style={{ width: 160, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          value={url.hostname}
          keyboardType='numeric'
          placeholder='hostname'
          onChangeText={t => setup.setUrl({ hostname: t })}
        />
        <Text>:</Text>
        <TextInput
          style={{ width: 60, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          keyboardType='number-pad'
          placeholder='port'
          maxLength={6}
          value={(url.port as any) && `${url.port}`}
          onChangeText={t => setup.setUrl({ port: parseInt(t, 10) })}
        />
      </View>
      {!isConnected && <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={this.onScan}
        style={{ width: 300, height: 300 }} />}
    </View>
  }
}
