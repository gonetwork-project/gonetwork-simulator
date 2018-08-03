import * as React from 'react'
import { View, Text, TextInput, Button, AsyncStorage, Switch } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'
import { Subscription, Observable } from 'rxjs'

import * as c from '../logic/config'
import { setUnknownError, checkP2P } from '../global'

type State = c.Combined & { error: boolean } & { p2pOk?: boolean, cryptoInited?: boolean, autoContinue: boolean }
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
    this.sub = c.combined
      .do(c => this.setState(c))
      .merge(c.error
        .map(e => !!e)
        .do(() => this.setState({ error: false }))
        .delay(250)
        .do(e => this.setState({ error: e }))
      )
      .merge(checkP2P.do(x => this.setState({ p2pOk: x })))
      // auto-continue - state
      .merge(
        Observable.defer(() => AsyncStorage.getItem('auto-continue'))
          .map(v => JSON.parse(v || 'false'))
          .do(v => this.setState({ autoContinue: v }))
      )
      // auto-continue action
      .merge(c.combined
        .switchMap((c) =>
          Observable.timer(200).mapTo(c))
        .filter(c => !!c.isConfigOk && this.state.autoContinue)
        .do(() => this.props.onDone())
      )
      // uncomment to imitate runtime exception
      // .merge(Observable.timer(2000).mergeMapTo(Observable.throw('runtime-error')))
      .subscribe({ error: setUnknownError })
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    if (ev.data.includes('gonetworkServer')) {
      c.setServerUrl(JSON.parse(ev.data).gonetworkServer)
    }
  }

  setAutoContinue = (v: boolean) => {
    this.setState({
      autoContinue: v
    })
    AsyncStorage.setItem('auto-continue', JSON.stringify(v))
  }

  renderCamera = () =>
    <RNCamera
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      onBarCodeRead={this.onScan}
      style={{ width: 300, height: 300 }} />

  renderAccounts = () => {
    const { contractsAccount: ma, accounts, isConfigOk } = this.state
    return ma ?
      <View style={{ paddingLeft: 12 }}>
        <Text>Contracts:</Text>
        <View style={{ paddingLeft: 12 }}>
          {Object.keys(ma.contracts).map(k => <Text key={k}>
            {`0x${ma.contracts[k].toString('hex')} -- ${k}`}
          </Text>)}
        </View>
        <Text style={{ marginTop: 24 }}>Accounts:</Text>
        <View style={{ paddingLeft: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>{`0x${ma.addressStr} -- master account`}</Text>
          {
            accounts /* todo: should not be hardcoded */
              .map((a, idx) =>
                <Text key={idx}>{(a && `0x${a.addressStr}`) || '...'}</Text>)
          }
        </View>

        {isConfigOk && <Button onPress={this.props.onDone} title='You are set up, tap to continue' />}
        {isConfigOk && <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
          <Switch value={this.state.autoContinue} onValueChange={this.setAutoContinue} />
          <Text style={{ marginLeft: 20 }}>Next time, continue automatically</Text>
        </View>}
      </View > :
      <View>
        <Text>...initializing...</Text>
      </View>
  }

  render () {
    if (!this.state) return null
    const { url, config, error } = this.state
    return <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', flexDirection: 'row' }}>
        Setup
      </Text>

      <StepHeader text='start services' />
      <Text>TODO: (link to) instructions or/and (link to) video </Text>

      <StepHeader text='provide main service url' />
      {error && <Text style={{ color: 'red' }}>Cannot connect</Text>}
      {config && <Text style={{ color: 'green' }}>OK</Text>}
      <Text>You can scan qr code or provide it manually</Text>
      <View style={{ flexDirection: 'row', padding: 8 }}>
        <Text>http://</Text>
        <TextInput
          style={{ width: 160, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          value={url.hostname}
          keyboardType='numeric'
          placeholder='hostname'
          onChangeText={t => c.setServerUrl({ hostname: t })}
        />
        <Text>:</Text>
        <TextInput
          style={{ width: 60, height: 20, backgroundColor: 'rgb(200,200,200)', padding: 4 }}
          keyboardType='number-pad'
          placeholder='port'
          maxLength={6}
          value={(url.port as any) && `${url.port}`}
          onChangeText={t => c.setServerUrl({ port: parseInt(t, 10) })}
        />
      </View>

      {!config && <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={this.onScan}
        style={{ width: 300, height: 300 }} />}

      {config && <StepHeader text='mqtt/p2p check' />}
      {config && (this.state.p2pOk ? <Text style={{ color: 'green' }}>OK</Text> : <Text>...checking...</Text>)}
      {config && <Text>We needed it for all off-chain communication.</Text>}

      {config && <StepHeader text='ethereum setup' />}
      {config && this.renderAccounts()}
    </View>
  }
}
