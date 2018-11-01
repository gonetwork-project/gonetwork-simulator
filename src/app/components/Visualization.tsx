import * as React from 'react'
import { WebView, Dimensions, View, ActivityIndicator, LayoutAnimation } from 'react-native'
import { Account } from '../logic/accounts'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Container, Header, Body, Text, Left, Button, Title, Right, Toast, Item, Label, Input } from 'native-base'
import { Subscription } from 'rxjs'
import { BlockNumber, Wei } from 'eth-types'
import { VisEvent } from '../../protocol'
import { sendMediated, sendDirect } from '../logic/offchain-actions'
import { as } from 'go-network-framework'

const html = require('../../vis/vis.html')

export interface Props {
  account: Account
  channel: Channel
  currentBlock: BlockNumber
  onClose: () => void
}

export interface State {
  showActions?: boolean
  amount?: Wei
}

export interface State {
  width: number, height: number,
  wvLoaded: boolean // webview's api seems broken
}

export class Visualization extends React.Component<Props, State> {
  state: State = { wvLoaded: false, ...Dimensions.get('screen') }

  wv!: WebView
  sub?: Subscription

  componentDidMount () {
    this.sub = this.props.account.events
      //   .do(e => this._emitEvent(e))
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  componentWillUpdate (props: Props) {
    this.emitEvent({ type: 'block-number', block: props.currentBlock.toNumber() })
  }

  updateState = (s: Partial<State>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    this.setState(s as any)
  }

  sendDirect = () => {
    sendDirect(this.props.account, this.props.channel.peerState.address,
      this.props.channel.myState.transferredAmount.add(this.state.amount!) as Wei)
      .then(() => this.setState({ amount: undefined }))
      .catch((e) => Toast.show({ type: 'danger', text: e.message || 'Uknown error' }))
  }

  close = () => {
    this.props.account.engine.closeChannel(this.props.channel.channelAddress)
      .then(x => console.log('CLOSED', x))
    this.updateState({ showActions: false })
  }

  sendMediated = () => {
    sendMediated(this.props.account, this.props.channel.peerState.address, this.state.amount!)
      .then(() => this.setState({ amount: undefined }))
      .catch((e) => Toast.show({ type: 'danger', text: e.message || 'Uknown error' }))
  }

  emitEvent = (e: VisEvent) => {
    if (this.wv) {
      const ev = `window._GN.emitEvent(${JSON.stringify(e)})`
      e.type !== 'block-number' && console.log('EMITTING-EVENT', ev)
      this.wv.injectJavaScript(ev)
    }
  }

  onLoad = () => {
    console.log('LOADED')
    this.setState({ wvLoaded: true })
    this.emitEvent({
      type: 'init',
      peer1: this.props.account.owner.addressStr,
      peer2: this.props.channel.peerState.address.toString('hex'),
      block: this.props.currentBlock.toNumber()
    })
  }

  showActions = () => this.props.channel.state === 'opened' && this.state.showActions

  renderActions = () => {
    if (this.showActions()) {
      return <View style={{
        flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 40, margin: 8
      }}>
        <Item floatingLabel style={{ maxWidth: '25%' }}>
          <Label>Amount</Label>
          <Input
            value={this.state.amount ? this.state.amount.toString(10) : ''}
            onChangeText={t => this.setState({ amount: parseInt(t, 10) ? as.Wei(parseInt(t, 10)) : undefined })}
            keyboardType='number-pad'
          />
        </Item>

        <View style={{ alignItems: 'center' }}>
          <Text note>Send Transfer</Text>
          <View style={{ flexDirection: 'row' }}>
            <Button disabled={!this.state.amount} transparent onPress={this.sendDirect}>
              <Text>Direct</Text>
            </Button>
            <Button disabled={!this.state.amount} transparent onPress={this.sendMediated}>
              <Text>Mediated</Text>
            </Button>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text note> </Text>
          <View style={{ flexDirection: 'row' }}>
            <Button transparent danger onPress={this.close}>
              <Text>Close</Text>
            </Button>
          </View>
        </View>
      </View>
    }
  }

  render () {
    const p = this.props
    const source = html
    return <Container>
      <Header>
        <Left>
          <Button transparent onPress={p.onClose}>
            <Text>Exit Vis</Text>
          </Button>
        </Left>
        <Body>
          <Title>0x{p.account.owner.addressStr}</Title>
        </Body>
        <Right>
          <Button transparent onPress={() => this.updateState({ showActions: !this.state.showActions })}>
            <Text>{this.showActions() ? 'Hide' : 'Actions'}</Text>
          </Button>
        </Right>
      </Header>

      {this.renderActions()}

      <WebView
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={this.onLoad}
        onError={err => console.log('ERR', err)}
        ref={(r) => (this as any).wv = r}
        style={{ flex: 1 }}
        source={source}
        // scrollEnabled={false}
        // @ts-ignore
        useWebKit={true}
      >
      </WebView>

      {!this.state.wvLoaded && <ActivityIndicator style={{ position: 'absolute', top: 128, alignSelf: 'center' }} />}
    </Container>
  }
}
