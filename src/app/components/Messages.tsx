import * as React from 'react'
import {
  Header, Text, Content, Container, Button, Input, Left,
  Icon, Body, Title, Right, Subtitle, Radio, ListItem, Item, Label, H2, Card, CardItem, Spinner, Toast, H3
} from 'native-base'

import { Account } from '../logic/accounts'

export interface Props {
  account: Account
  onDone: () => void
}

export interface State {

}

export class Messages extends React.Component<Props, State> {

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
      <Button key='f' disabled={ms.length === 0} transparent onPress={this.flush} style={{ alignSelf: 'center', marginBottom: 24 }}>
        <Text>Flush Messages</Text>
      </Button>,
      <Text key='h' note>{ms.length} message{ms.length !== 1 ? 's' : ''} buffered.</Text>
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
