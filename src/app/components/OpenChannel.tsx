import * as React from 'react'
import { View, ActivityIndicator } from 'react-native'
import {
  Header, Text, Content, Container, Button, Input, Left,
  Icon, Body, Title, Right, Subtitle, Radio, ListItem, Item, Label, H2, Card, CardItem, Spinner, Toast
} from 'native-base'

import { Address, Wei } from 'eth-types'
import { as } from 'go-network-framework'
import { Subject, Subscription, Observable, BehaviorSubject } from 'rxjs'

import { Account, AccountBalanceFormatted } from '../logic/accounts'
import { openChannelAndDeposit, OpenAndDepositState, openAndDepositStateStart, OpenAndDepositSteps } from '../logic/onchain-actions'
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
  progress?: OpenAndDepositState

}

const min = (a: Wei, b: Wei) => a.gt(b) ? b : a

const progressMessage: { [K in OpenAndDepositSteps]: string } = {
  ApproveGot: 'Approve Go Network Channel Manager',
  NewChannel: 'Create New Channel',
  ApproveChannel: 'Approve Created Channel',
  Deposit: 'Deposit ERC20 Tokens To Channel'
}
const progressOrder: OpenAndDepositSteps[] = ['ApproveGot', 'NewChannel', 'ApproveChannel', 'Deposit']

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
    const progress = new BehaviorSubject<OpenAndDepositState>(openAndDepositStateStart())
    this.sub = Observable.merge(
      progress.do(p => this.setState({ progress: p })),
      this.openSub
        .do(() => this.setState({ status: 'in-progress' }))
        .exhaustMap(s =>
          Observable.defer(
            () => openChannelAndDeposit(this.props.account, s.amount!, s.other,
              (k, s) => progress.next(Object.assign({}, progress.value, { [k]: { status: s } })))
          )
            .mapTo('success' as Status)
            .mergeMap(s => Observable.merge(
              Observable.of(s),
              Observable.timer(10)
                .do(() => Toast.show({
                  type: 'success',
                  text: 'New Channel Created',
                  duration: 5000
                }))
                .do(() => this.props.onDone())
                .ignoreElements()
            ))
            .catch(() => Observable.of('error' as Status))
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

  reportProgress = () => {
    const p = this.state.progress
    const s = this.state.status
    if (!p) return <ActivityIndicator /> // this should not happen
    return <Card style={{ width: '80%', marginTop: 48, alignSelf: 'center' }}>
      {
        progressOrder
          .map((k) => ({ k, p: p[k], m: progressMessage[k] }))
          .map(({ p, m, k }) => <CardItem key={k}>
            <View style={{ flexDirection: 'row', width: '100%', paddingRight: 72, justifyContent: 'space-between', alignItems: 'center' }}>
              <Text note={p.status === 'not-started'}>{m}</Text>
              {p.status === 'waiting' ?
                <ActivityIndicator size='small' style={{ marginRight: 24 }} /> :
                <Icon name='ios-checkmark' active={p.status !== 'not-started'}
                  style={{ color: p.status === 'ok' ? 'green' : 'rgba(128,128,128,0.6)' }} />
              }
            </View>
          </CardItem>)
      }
    </Card>
  }

  renderContent () {
    const without = this.props.accountsWithoutChannel

    switch (this.state.status) {
      case 'active': {
        if (without.length === 0) {
          return <Text>No accounts without openned channel found.</Text>
        }

        if (!this.enoughTokens()) {
          return <Text>You need to have some tokens to be able to open new netting channel. Please use a master account instead.</Text>
        }
        return <View>
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
      }
      case 'success':
      case 'error':
      case 'in-progress': return this.reportProgress()
    }
  }

  render () {
    const p = this.props
    return <Container>
      <Header>
        <Left>
          <Button transparent disabled={this.state.status !== 'active'} onPress={p.onDone}>
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
