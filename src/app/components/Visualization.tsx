import * as React from 'react'
import { WebView, Dimensions, View } from 'react-native'
import { Account } from '../logic/accounts'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Container, Header, Body, Text, Left, Button, Title, Right } from 'native-base'

const html = require('../../vis/vis.html')

export interface Props {
  account: Account
  channel: Channel
  onClose: () => void
}

export interface State {
  width: number, height: number
}

export class Visualization extends React.Component<Props, State> {
  state: State = Dimensions.get('screen')

  wv!: WebView

  onLoad = () => {
    console.log('LOADED')
    this.wv.injectJavaScript(`window._GN.emitInit(0)`)
    let i = 0
    // setInterval(() => {
    //   const e = `window._GN.emitEvent(${JSON.stringify({ event: i++ })})`
    //   // console.log('EVENT', e)
    //   this.wv.injectJavaScript(e)
    // }, 2000)
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
        scrollEnabled={false}
        // @ts-ignore
        useWebKit={true}
      >
      </WebView>
    </Container>
  }
}
