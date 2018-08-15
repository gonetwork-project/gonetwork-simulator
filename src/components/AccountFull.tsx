import * as React from 'react'
import { View, Text, Button, ActivityIndicator } from 'react-native'
import { Subscription, Subject, Observable } from 'rxjs'

import { Address } from 'eth-types'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Account, AccountBalance } from '../logic/accounts'
import { OpenChannel } from '../components/OpenChannel'
import { ChannelShort } from './ChannelShort'

export interface Props {
  account: Account
  otherAccounts: Array<{ address: Address, addressStr: string }>
  balance?: AccountBalance
  onBack: () => void
}

export interface State {
  selectedChannel?: any
  channels?: Channel[]
}

export class AccountFull extends React.Component<Props, State> {
  state: State = {}

  sub?: Subscription

  componentDidMount () {
    this.sub = this.props.account.blockchain.monitoring
      .asStream('*')
      .startWith(true)
      .do(() => this.setState({
        channels: Object.values(this.props.account.engine.channels)
      }))
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderChannels = () => {
    const cs = this.state.channels
    if (!cs) return <ActivityIndicator />
    if (cs.length === 0) return <Text>No openned channels.</Text>
    return cs.map(ch => <ChannelShort key={ch.peerState.address.toString('hex')} channel={ch} onSelected={() => console.log('SELECTED')} />)
  }

  render () {
    const p = this.props
    return <View style={{ padding: 20 }}>
      <Button title='back' onPress={p.onBack} />
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>0x{p.account.owner.addressStr}</Text>
      {
        !p.balance ?
          <ActivityIndicator size='small' /> :
          <Text>{JSON.stringify(p.balance, null, 4)}</Text>
      }

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>Open Netting Channels</Text>
      {!this.props.balance ?
        <ActivityIndicator /> :
        <OpenChannel balance={this.props.balance} account={this.props.account} otherAccounts={this.props.otherAccounts} />
      }

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>Netting Channels</Text>
      {this.renderChannels()}
    </View>
  }
}
