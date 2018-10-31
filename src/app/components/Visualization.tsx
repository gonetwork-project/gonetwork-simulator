import * as React from 'react'
import { WebView, Dimensions, View, ActivityIndicator } from 'react-native'
import { Account } from '../logic/accounts'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Container, Header, Body, Text, Left, Button, Title, Right } from 'native-base'
import { Subscription } from 'rxjs'
import { BlockNumber } from 'eth-types'
import { VisEvent } from '../../protocol'

const html = require('../../vis/vis.html')

export interface Props {
  account: Account
  channel: Channel
  currentBlock: BlockNumber
  onClose: () => void
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
    this._emitEvent({ type: 'block-number', block: props.currentBlock.toNumber() })
  }

  _emitEvent = (e: VisEvent) => {
    if (this.wv) {
      const ev = `window._GN.emitEvent(${JSON.stringify(e)})`
      e.type !== 'block-number' && console.log('EMITTING-EVENT', ev)
      this.wv.injectJavaScript(ev)
    }
  }

  onLoad = () => {
    console.log('LOADED')
    this.setState({ wvLoaded: true })
    this._emitEvent({
      type: 'init',
      peer1: this.props.account.owner.addressStr,
      peer2: this.props.channel.peerState.address.toString('hex'),
      block: this.props.currentBlock.toNumber()
    })
  }

  render () {
    const p = this.props
    const source = html
    return <Container>
      <Header>
        <Left>
          <Button transparent onPress={p.onClose}>
            <Text>Close</Text>
          </Button>
        </Left>
        <Body>
          <Title>0x{p.account.owner.addressStr}</Title>
        </Body>
        <Right>
          <View />
        </Right>
      </Header>

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
