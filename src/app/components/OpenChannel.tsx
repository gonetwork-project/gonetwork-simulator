import * as React from 'react'
import { View, Text, Button, ActivityIndicator, TextInput } from 'react-native'

import { Address, Wei } from 'eth-types'
import { as } from 'go-network-framework'
import { Subject, Subscription, Observable } from 'rxjs'

import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Account, AccountBalance } from '../logic/accounts'
import { openChannelAndDeposit } from '../logic/onchain-actions'

type Status = 'active' | 'in-progress' | 'error' | 'success'

export interface Props {
  account: Account
  balance: AccountBalance
  accountsWithoutChannel: Array<{ address: Address, addressStr: string }>
}

export interface State {
  status: Status
  amount: Wei
}

export class OpenChannel extends React.Component<Props, State> {
  state: State
  openSub = new Subject<State & { other: Address }>()
  sub?: Subscription

  constructor (p: Props) {
    super(p)
    this.state = {
      status: 'active',
      amount: as.Wei(1000)
    }
  }

  componentDidMount () {
    this.sub = this.openSub
      .do(() => this.setState({ status: 'in-progress' }))
      .exhaustMap(s =>
        Observable.defer(
          () => openChannelAndDeposit(this.props.account, s.amount, s.other)
        )
          // .do((x) => console.warn('OK', x))
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

  // todo: improve 1. fee should be obtained from contract
  canOpen = () => this.props.balance.hsToken.gt(as.Wei(0)) && this.props.balance.gotToken.gt(as.Wei(500))
  onOpen = (other: Address) => this.openSub.next(Object.assign({ other }, this.state))

  updateAmount = (v: string) => {
    this.setState({
      amount: as.Wei(v)
    })
  }

  render () {
    const without = this.props.accountsWithoutChannel

    if (without.length === 0) {
      return <Text>No accounts without openned channel found.</Text>
    }

    if (!this.canOpen()) {
      return <Text>You need to have some tokens to be able to open new netting channel. Please use a master account instead.</Text>
    }

    switch (this.state.status) {
      case 'active': return <View>
        <Text>Amount: (todo - limit to balance)</Text>
        <TextInput
          style={{ width: 240, height: 32, backgroundColor: 'rgb(200,200,200)', padding: 8 }}
          value={this.state.amount.toString(10)}
          onChangeText={this.updateAmount}
          keyboardType='number-pad'
        />
        {without.map(w =>
          <View key={w.addressStr} style={{ padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <Button title='Open' onPress={() => this.onOpen(w.address)} />
            <Text style={{ fontWeight: 'bold' }}>0x{w.addressStr.substring(0, 10)}</Text>
          </View>
        )}
      </View>
      case 'in-progress': return <ActivityIndicator />
      case 'success': return <Text style={{ color: 'green' }}>Channel Opened Successfully!</Text>
      case 'error': return <Text style={{ color: 'red' }}>Opening Channel Failed</Text>
    }

  }
}
