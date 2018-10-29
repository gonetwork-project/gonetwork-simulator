import * as React from 'react'
import { View } from 'react-native'
import {
  Header, Text, Content, Container, Button, Left, Body, Title, Right, Subtitle, Card, CardItem
} from 'native-base'
import { BN } from 'bn.js'

import { Account } from '../logic/accounts'

const headerKeys = ['classType', 'nonce', 'msgID']
const headerKeysMap = Object.values(headerKeys).reduce((a, k) => (a[k] = true, a), {})

const valueToString = (v: Buffer | BN | string) =>
  BN.isBN(v) ? v.toString(10) :
    Buffer.isBuffer(v) ? '0x' + v.toString('hex') :
    typeof v === 'object' ? '[TODO]' : `${v}`

const MessageItem = (k: string, v: Buffer | BN | string) =>
  <View key={k} style={{ margin: 4 }}>
    <Text note>{k}</Text>
    <Text>{valueToString(v)}</Text>
  </View>

export interface Props {
  account: Account
  onDone: () => void
}

export class Messages extends React.Component<Props> {

  flush = () => {
    this.props.account.p2pProxy.flush()
    this.forceUpdate()
  }

  enterManual = () => {
    this.props.account.p2pProxy.setMode('manual')
    this.forceUpdate()
  }

  exitManual = () => {
    this.props.account.p2pProxy.setMode('normal')
    this.forceUpdate()
  }

  renderNormal = () => ([
    <Button key='b' onPress={this.enterManual} style={{ alignSelf: 'center', margin: 24 }}>
      <Text>Enter Manual Mode</Text>
    </Button>,
    <Text note key='t'>
      In manual mode outgoing peer to peer messages are buffered. You can get familiar with them and test faulty conditions.
    </Text>
  ])

  renderManual = () => {
    const ms = this.props.account.p2pProxy.messages.value
    return [
      <Button key='b' onPress={this.exitManual} style={{ alignSelf: 'center', margin: 24 }}>
        <Text>Exit Manual Mode</Text>
      </Button>,
      <Button key='f' disabled={ms.length === 0} bordered onPress={this.flush} style={{ alignSelf: 'center', marginBottom: 24 }}>
        <Text>Flush Messages</Text>
      </Button>,
      <Text key='h' note>{ms.length} message{ms.length !== 1 ? 's' : ''} buffered.</Text>,
      ...ms.map(([_, msg]) => <Card key={msg.getHash() as any}>
        <CardItem header style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {headerKeys.map(k => <View key={k} style={{ flex: k === 'classType' ? 3 : 1 }}>
            <Text note>{k}</Text>
            <Text ellipsizeMode='head'>{valueToString(msg[k])}</Text>
          </View>)}
        </CardItem>
        <CardItem cardBody style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
          {
            Object.keys(msg).filter(k => !headerKeysMap[k]).map((k) => MessageItem(k, msg[k]))
          }
        </CardItem>
      </Card>)
    ]
  }

  render () {
    const p = this.props
    return <Container>
      <Header>
        <Left>
          <Button transparent onPress={p.onDone}>
            <Text>Close</Text>
          </Button>
        </Left>
        <Body>
          <Title>Messages</Title>
          <Subtitle>0x{p.account.owner.addressStr.substring(0, 16)}...</Subtitle>
        </Body>
        <Right>
        </Right>
      </Header>

      <Content padder>
        {this.props.account.p2pProxy.getMode() === 'normal' ?
          this.renderNormal() : this.renderManual()
        }
      </Content>
    </Container>
  }
}
