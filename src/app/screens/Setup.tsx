import * as React from 'react'
import { View, Text, TextInput, Button } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'
import { Subscription, Observable } from 'rxjs'

import { setUnknownError } from '../global'
import { GeneralInfo, SessionConfigClient, SessionId } from '../../protocol'
import * as setup from '../logic/setup'

type State = {
  url: setup.Url,
  connection: setup.ConnectionWithStatus
  cryptoInited?: boolean
  autoContinue: boolean
  generalInfo?: GeneralInfo
  sessionConfig: SessionConfigClient
}
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
      setup.sessionConfig.map(s => ({ sessionConfig: s })),
      setup.connectionWithStatus.map(c => ({ connection: c })),
      setup.generalInfo
        // .do(g => g && this.createSession()) // TODO remove / allow automatic creation in UI
        .map(g => ({ generalInfo: g }))
    ) as Observable<State>)
      .do(c => this.setState(c))
      .merge(
        setup.sessionConfig
          .switchMap(c =>
            c.blockTime >= 100 ?
              Observable.empty() :
              Observable.of(Object.assign({}, c, { blockTime: setup.defaultBlockTime }))
                .delay(2000)
          )
          .do(setup.setSessionConfig)
      )
      // uncomment to imitate runtime exception
      // .merge(Observable.timer(2000).mergeMapTo(Observable.throw('runtime-error')))
      .subscribe({ error: setUnknownError })
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  createSession = () =>
    (this.state.connection as WebSocket).send(
      JSON.stringify({ type: 'create-session', payload: this.state.sessionConfig }))

  joinSession = (sessionId: SessionId) =>
    (this.state.connection as WebSocket).send(
      JSON.stringify({ type: 'join-session', payload: { sessionId } }))

  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    if (ev.data.includes('gonetworkServer')) {
      setup.setUrl(JSON.parse(ev.data).gonetworkServer)
    }
  }

  renderCamera = () =>
    <RNCamera
      onMountError={err => console.warn('CAMERA-NOT-SUPPORTED', err)}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      onBarCodeRead={this.onScan}
      style={{ width: 300, height: 300 }}
    />

  renderSessions = (i: GeneralInfo) => {
    if (i.active.length === 0) return null

    return <View style={{ padding: 20 }}>
      {i.active.map(s =>
        <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>id: {s.id}</Text>
          <Text>Block time: {s.blockTime}</Text>
          <Button onPress={() => this.joinSession(s.id)} title='join' />
        </View>
      )}
    </View>
  }

  renderInfo = () => {
    const i = this.state.generalInfo
    if (!i) return null
    const cfg = this.state.sessionConfig
    const wrongBlockTime = !cfg.blockTime || cfg.blockTime < setup.minBlockTime
    return <View style={{ padding: 20, backgroundColor: 'rgba(128, 128, 128, 0.2)' }}>

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}>
        <Text>Block time in ms:</Text>
        <TextInput
          style={{ width: 60, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4, margin: 4 }}
          keyboardType='number-pad'
          maxLength={6}
          value={(cfg.blockTime as any) && `${cfg.blockTime}`}
          onChangeText={t => setup.setSessionConfig({ blockTime: parseInt(t, 10) })}
        />
        {wrongBlockTime && <Text style={{ color: 'red' }}>Block time has to be at least {setup.minBlockTime} ms</Text>}
      </View>

      <Button title='New Session' disabled={wrongBlockTime} onPress={this.createSession} />

      <Text>Connected: {i.connected}</Text>
      <Text>Sessions: {i.active.length}</Text>
      <Text>Sessions-in-creation: {i.inCreation.length}</Text>

      {this.renderSessions(i)}
    </View>
  }

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

      {this.renderInfo()}
    </View>
  }
}
