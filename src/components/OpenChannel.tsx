import * as React from 'react'
import { View, Text, Button, ActivityIndicator, TextInput } from 'react-native'

import { Address, Wei } from 'eth-types'
import { as } from 'go-network-framework'
import { Subject, Subscription, Observable } from 'rxjs'

import { Account, AccountBalance } from '../logic/accounts'
import { openChannelAndDeposit } from '../logic/onchain-actions'

type Status = 'active' | 'in-progress' | 'error' | 'success'

export interface Props {
  account: Account
  balance: AccountBalance
  otherAccounts: Array<{ address: Address, addressStr: string }>
}

export interface State {
  status: Status
  amount: Wei
  other: { address: Address, addressStr: string }
}

export class OpenChannel extends React.Component<Props, State> {
  state: State
  openSub: Subject<State> = new Subject<State>()
  sub?: Subscription

  constructor (p: Props) {
    super(p)
    this.state = {
      status: 'active',
      amount: as.Wei(1000),
      other: p.otherAccounts[0] // assumption at least one account present
    }
  }

  componentDidMount () {
    this.sub = this.openSub
      .do(() => this.setState({ status: 'in-progress' }))
      .exhaustMap(s =>
        Observable.defer(
          () => openChannelAndDeposit(this.props.account, s.amount, s.other.address)
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
  onOpen = () => this.openSub.next(this.state)

  updateAmount = (v: string) => {
    this.setState({
      amount: as.Wei(v)
    })
  }

  render () {
    if (!this.canOpen()) {
      return <Text>You need to have some tokens to be able to open new netting channel. Please use a master account instead.</Text>
    }

    switch (this.state.status) {
      case 'active': return <View>
        <Text>Other: (todo - allow selection)</Text>
        <Text>0x{this.state.other.addressStr}</Text>
        <Text>Amount: (todo - limit to balance)</Text>
        <TextInput
          style={{ width: 240, height: 32, backgroundColor: 'rgb(200,200,200)', padding: 8 }}
          value={this.state.amount.toString(10)}
          onChangeText={this.updateAmount}
          keyboardType='number-pad'
        />
        <Button title='Open' onPress={this.onOpen} />
      </View>
      case 'in-progress': return <ActivityIndicator />
      case 'success': return <Text style={{ color: 'green' }}>Channel Opened Successfully!</Text>
      case 'error': return <Text style={{ color: 'red' }}>Opening Channel Failed</Text>
    }

  }
}
