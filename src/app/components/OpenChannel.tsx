import * as React from 'react'
import { View, ActivityIndicator } from 'react-native'
import {
  Header, Text, Content, Container, Button, Input, Left,
  Icon, Body, Title, Right, Subtitle, Radio, ListItem, Item, Label, H2
} from 'native-base'

import { Address, Wei } from 'eth-types'
import { as } from 'go-network-framework'
import { Subject, Subscription, Observable } from 'rxjs'

import { Account, AccountBalanceFormatted } from '../logic/accounts'
import { openChannelAndDeposit } from '../logic/onchain-actions'
import { Balance } from './Balance'

type Status = 'active' | 'in-progress' | 'error' | 'success'

export interface Props {
  account: Account
  balance: AccountBalanceFormatted
  accountsWithoutChannel: Array<{ address: Address, addressStr: string }>
  onDone: () => void
}

export interface State {
  status: Status
  selectedIdx: number
  amount?: Wei
}

const min = (a: Wei, b: Wei) => a.gt(b) ? b : a

export class OpenChannel extends React.Component<Props, State> {
  state: State
  openSub = new Subject<State & { other: Address }>()
  sub?: Subscription

  constructor (p: Props) {
    super(p)
    this.state = {
      status: 'active',
      amount: min(as.Wei(1000), p.balance.hsToken),
      selectedIdx: 0
    }
  }

  componentDidMount () {
    this.sub = this.openSub
      .do(() => this.setState({ status: 'in-progress' }))
      .exhaustMap(s =>
        Observable.defer(
          () => openChannelAndDeposit(this.props.account, s.amount!, s.other)
        )
          .mapTo('success' as Status)
          .catch(() => Observable.of('error' as Status))
          .mergeMap(s =>
            Observable.timer(3000)
              .take(1)
              .mapTo('active' as Status)
              .startWith(s)
              .do(s => this.setState({ status: s }))
          )
      )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  enoughTokens = () => this.props.balance.hsToken.gt(as.Wei(0)) && this.props.balance.gotToken.gte(as.Wei(50))
  canOpen = () => this.state.amount && this.state.amount.gt(0)
  onOpen = () => this.openSub.next(Object.assign({ other: this.props.accountsWithoutChannel[this.state.selectedIdx].address },
    this.state))

  updateAmount = (v: string) =>
    this.setState({
      amount: v === '' ? undefined : min(as.Wei(v), this.props.balance.hsToken)
    })

  renderContent () {
    const without = this.props.accountsWithoutChannel

    if (without.length === 0) {
      return <Text>No accounts without openned channel found.</Text>
    }

    if (!this.enoughTokens()) {
      return <Text>You need to have some tokens to be able to open new netting channel. Please use a master account instead.</Text>
    }

    switch (this.state.status) {
      case 'active': return <View>
        <View style={{ flexDirection: 'row', padding: 8, justifyContent: 'space-around', alignItems: 'center' }}>
          <Item floatingLabel style={{ maxWidth: '30%' }}>
            <Label>Amount</Label>
            <Input
              placeholder={`max: ${this.props.balance.gotToken.toString(10)}`}
              value={this.state.amount ? this.state.amount.toString(10) : ''}
              onChangeText={this.updateAmount}
              keyboardType='number-pad'
            />
          </Item>
          <Button disabled={!this.canOpen()} style={{ margin: 8, alignSelf: 'center' }}
            onPress={this.onOpen}
          >
            <Text>Open</Text>
          </Button>
        </View>
        <H2>Select Peer</H2>
        {without.map((w, idx) =>
          <ListItem key={w.addressStr} onPress={() => this.state.selectedIdx = idx}>
            <Left><Text>0x{w.addressStr}</Text></Left>
            <Right>
              <Radio selected={this.state.selectedIdx === idx} />
            </Right>
          </ListItem>
        )}
        <Text note style={{ marginTop: 16 }}>Only one netting channel may be active between two Ethereum addresses.
          To open another one the previous one needs to settle.
          The above selection excludes address which have open channel.
        </Text>
      </View>
      case 'in-progress': return <ActivityIndicator />
      case 'success': return <Text style={{ color: 'green' }}>Channel Opened Successfully!</Text>
      case 'error': return <Text style={{ color: 'red' }}>Opening Channel Failed</Text>
    }
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
          <Title>Open Netting Channel</Title>
          <Subtitle>0x{p.account.owner.addressStr.substring(0, 21)}...</Subtitle>
        </Body>
        <Right>
        </Right>
      </Header>

      <Content padder>
        {
          !p.balance ?
            <ActivityIndicator size='small' /> :
            Balance({ balance: p.balance, direction: 'row' })
        }
        {this.renderContent()}
      </Content>
    </Container>
  }
}
