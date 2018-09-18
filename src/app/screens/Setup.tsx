import * as React from 'react'
import { View, TextInput, ActivityIndicator } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'
import { Subscription, Observable } from 'rxjs'

import { Container, Text, Button, H1, H2, Tab, Tabs, Card, Item, Input, Label, Form } from 'native-base'

import { setUnknownError } from '../global'
import { GeneralInfo, SessionConfigClient, SessionId } from '../../protocol'
import * as setup from '../logic/setup'

type Step = 'connect' | 'sessions' | 'info'

type State = {
  url: setup.Url,
  connection: setup.ConnectionWithStatus
  cryptoInited?: boolean
  autoContinue: boolean
  generalInfo?: GeneralInfo
  sessionConfig: SessionConfigClient

  step: Step
  infoPanelOpened?: boolean
}
interface Props {
  onDone: () => void
}

const steps: { [K in Step]: string } = {
  info: 'info',
  connect: 'connect',
  sessions: 'sessions'
}
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
    setup.send('create-session', this.state.sessionConfig)

  joinSession = (sessionId: SessionId) =>
    setup.send('join-session', { sessionId })

  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    if (ev.data.includes('gonetworkServer')) {
      setup.setUrl(JSON.parse(ev.data).gonetworkServer)
    }
  }
  // #region Connect
  renderCamera = () =>
    <RNCamera
      onMountError={err => console.warn('CAMERA-NOT-SUPPORTED', err)}
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      onBarCodeRead={this.onScan}
      style={{ width: 300, height: 300 }}
    />

  renderConnect = () => {
    const { url, connection } = this.state
    const isConnected = connection && !!(connection as WebSocket).onopen
    const i = this.state.generalInfo
    return <View style={{ padding: 12, flexDirection: 'column' }}>
      <H2>Please, provide simulator server url</H2>
      <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 8, minHeight: 48 }}>
        <Item style={{ maxWidth: 50 }} stackedLabel underline={false}>
          <Label></Label>
          <Input placeholder='ws://' disabled />
        </Item>
        <Item style={{ flex: 1 }} stackedLabel>
          <Label>Hostname</Label>
          <Input
            value={url.hostname}
            onChangeText={t => setup.setUrl({ hostname: t })}
          />
        </Item>
        <Item style={{ maxWidth: 12 }} stackedLabel underline={false}>
          <Label></Label>
          <Input placeholder=':' disabled />
        </Item>
        <Item style={{ width: 60 }} stackedLabel>
          <Label>Port</Label>
          <Input
            maxLength={6}
            keyboardType='number-pad'
            value={(url.port as any) && `${url.port}`}
            onChangeText={t => setup.setUrl({ port: parseInt(t, 10) })}
          />
        </Item>

        {/* {connection === 'failed' && <Text style={{ color: 'red' }}>cannot connect</Text>} */}
        <View style={{ width: 40 }}>
          {connection === 'connecting' && <ActivityIndicator style={{ marginLeft: 8 }} />}
          {isConnected && <Text style={{ color: 'green' }}>OK</Text>}
        </View>
      </Card>
      {
        !isConnected && <View style={{ padding: 8, alignSelf: 'stretch', flexDirection: 'column', alignItems: 'center' }}>
          <RNCamera
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
            onBarCodeRead={this.onScan}
            style={{ width: 300, height: 300 }} />
          <Text style={{ fontSize: 10, opacity: 0.7 }}>quick setup with QR code</Text>
        </View>
      }
      {
        isConnected && i && <Card style={{ padding: 8 }}>
          <Text>Connected: {i.connected}</Text>
          <Text>Sessions: {i.active.length}</Text>
          <Text>Sessions-in-creation: {i.inCreation.length}</Text>
        </Card>
      }
    </View>
  }
  // #endregion Connect

  // #region Setup
  renderSessions = (i: GeneralInfo) => {
    if (i.active.length === 0) return <Text>No active sessions you could join.</Text>

    return <View style={{ paddingTop: 20 }}>
      {i.active.map(s =>
        <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 24 }}>
          <Text style={{ fontWeight: 'bold' }}>id: {s.id}</Text>
          <Text>Block time: {s.blockTime}</Text>
          <Button transparent disabled={!s.canCreateAccount} onPress={() => this.joinSession(s.id)}>
            <Text>Join</Text>
          </Button>
        </Card>
      )}
    </View>
  }

  renderSetup = () => {
    const i = this.state.generalInfo
    if (!i) {
      return <View style={{ padding: 64 }}>
        <H2>You need to connect to the server first - TODO add some image</H2>
      </View>
    }
    const cfg = this.state.sessionConfig
    const wrongBlockTime = !cfg.blockTime || cfg.blockTime < setup.minBlockTime
    return <Container style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 32 }}>
        <Item style={{ maxWidth: 160 }} stackedLabel error={wrongBlockTime}>
          <Label>Block time in ms:</Label>
          <Input
            keyboardType='number-pad'
            maxLength={6}
            value={(cfg.blockTime as any) && `${cfg.blockTime}` || ''}
            onChangeText={t => setup.setSessionConfig({ blockTime: parseInt(t, 10) })}
          />
        </Item>

        <Button disabled={wrongBlockTime} onPress={this.createSession} style={{ margin: 24 }}>
          <Text>New Session</Text>
        </Button>

        {/* {wrongBlockTime && <Text style={{ color: 'red' }}>Block time has to be at least {setup.minBlockTime} ms.</Text>} */}
      </View>

      {this.renderSessions(i)}
    </Container>
  }
  // #endregion Setup

  render () {
    if (!this.state) return null
    return <Container>
      <H1>Welcome to GoNetwork Simulator App</H1>
      <Tabs>
        <Tab heading={steps.connect}>
          {this.renderConnect()}
        </Tab>
        <Tab heading={steps.sessions}>
          {this.renderSetup()}
        </Tab>
        <Tab heading={steps.info}>
          <Text>
            TOOD: desription of the project, links to instructions / docs etc. Probably better to have 1-2 sentence always visible
            and make it part of connect panel
            </Text>
        </Tab>
      </Tabs>
    </Container>
  }
}
