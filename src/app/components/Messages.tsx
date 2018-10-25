import * as React from 'react'
import { View } from 'react-native'
import {
  Header, Text, Content, Container, Button, Left, Icon, Body, Title, Right, Subtitle, Card, CardItem
} from 'native-base'
import { BN } from 'bn.js'

import { Account } from '../logic/accounts'

const MessageItem = (k: string, v: Buffer | BN | string) => {
  const _v = BN.isBN(v) ? v.toString(10) :
    Buffer.isBuffer(v) ? '0x' + v.toString('hex') : `${v}`
  return <View key={k} style={{ flexDirection: 'row', width: '100%' }}>
    <Text note style={{ alignContent: 'flex-end', width: 80 }}>{k}</Text>
    <Text>{_v}</Text>
  </View>
}

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
      ...ms.map(([to, msg]) => <Card key={msg.getHash() as any}>
        <CardItem header>
          <Text>{msg.classType}</Text>
        </CardItem>
        <Body>
          {MessageItem('to', to)}
          {Object.keys(msg).map((k) => MessageItem(k, msg[k]))}
          {MessageItem('hash', msg.getHash() as any)}
        </Body>
      </Card>)
    ]
  }

  render () {
    const p = this.props
    return <Container>
      <Header>
        <Left>
          <Button transparent onPress={p.onDone}>
            <Icon name='arrow-back' />
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
