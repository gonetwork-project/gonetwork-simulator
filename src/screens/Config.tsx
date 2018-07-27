import * as React from 'react'
import { View, Text, TextInput, Button } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'
import { Subscription, Observable } from 'rxjs'

import * as c from '../logic/config'
import { checkP2P } from '../logic/check-p2p'

type State = c.Combined & { error: boolean } & { p2pOk: boolean }

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
      .merge(checkP2P.do(x => this.setState({ p2pOk: x })))
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

  renderCamera = () =>
    <RNCamera
      barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
      onBarCodeRead={this.onScan}
      style={{ width: 300, height: 300 }} />

  renderAccounts = () => {
    const { masterAccount: ma, accounts } = this.state
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
            [0, 1, 2] /* todo: should not be hardcoded */
              .map(idx => {
                const a = accounts[idx]
                return <Text key={idx}>{(a && `0x${a.addressStr}`) || '...'}</Text>
              })
          }
        </View>

        {accounts.length === 3 && <Button onPress={() => null} title='You are set up, press to continue' />}
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

      {!config && <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={this.onScan}
        style={{ width: 300, height: 300 }} />}

      {config && <StepHeader text='mqtt/p2p check' />}
      {config && this.state.p2pOk ? <Text style={{ color: 'green' }}>OK</Text> : <Text>...checking...</Text>}
      {config && <Text>We needed it for all off-chain communication.</Text>}

      {config && <StepHeader text='ethereum setup' />}
      {config && this.renderAccounts()}
    </View>
  }
}
