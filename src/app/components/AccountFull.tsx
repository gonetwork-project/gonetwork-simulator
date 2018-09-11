import * as React from 'react'
import { View, Text, Button, ActivityIndicator, Modal, Switch } from 'react-native'
import { Subscription, Observable } from 'rxjs'

import { BlockNumber } from 'eth-types'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Account, AccountBalance, OtherAccount } from '../logic/accounts'
import { OpenChannel } from './OpenChannel'
import { ChannelShort } from './Channel'
import { Events } from './Events'

export interface Props {
  account: Account
  otherAccounts: OtherAccount[]
  currentBlock?: BlockNumber
  balance?: AccountBalance
  onBack: () => void
}

export interface State {
  ignoreSecretToProof: boolean
  accountsWithoutChannel?: OtherAccount[]
  selectedChannel?: any
  channels?: Channel[]
  showEvents?: boolean
}

export const getAccountsWithoutChannel = (channels?: Channel[], other?: OtherAccount[]) =>
  channels && other && other.filter(o => !channels.find(ch => o.address.compare(ch.peerState.address) === 0))

export class AccountFull extends React.Component<Props, State> {
  state: State = {
    ignoreSecretToProof: false
  }

  sub?: Subscription

  componentDidMount () {
    this.sub = Observable.merge(
      this.props.account.blockchain.monitoring
        .asStream('*')
        .startWith(true as any)
        .map(() => Object.values(this.props.account.engine.channels))
        .do((channels) => this.setState({
          channels,
          accountsWithoutChannel: getAccountsWithoutChannel(channels, this.props.otherAccounts)
        })),
      this.props.account.ignoreSecretToProof
        .do(v => this.setState({ ignoreSecretToProof: v }))
    )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderChannels = () => {
    const cs = this.state.channels
    if (!cs) return <ActivityIndicator />
    if (cs.length === 0) return <Text>No openned channels.</Text>
    return cs.map(ch => <ChannelShort
      key={ch.peerState.address.toString('hex')}
      currentBlock={this.props.currentBlock!}
      account={this.props.account}
      channel={ch} onSelected={() => console.log('SELECTED')} />)
  }

  render () {
    const p = this.props
    return <View style={{ padding: 20 }}>
      <View style={{ padding: 12, flexDirection: 'row' }}>
        <Button title='Back' onPress={p.onBack} />
        <Button title='Show-Events' onPress={() => this.setState({ showEvents: true })} />
      </View>

      <Text>Current block: {this.props.currentBlock && this.props.currentBlock.toString(10) || '...'}</Text>

      {this.state.showEvents && <Modal animationType='slide'>
        <Events account={this.props.account} onClose={() => this.setState({ showEvents: false })} />
      </Modal>}

      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>0x{p.account.owner.addressStr}</Text>
      {
        !p.balance ?
          <ActivityIndicator size='small' /> :
          <Text>{JSON.stringify(p.balance, null, 4)}</Text>
      }

      <View style={{ flexDirection: 'row', padding: 8, alignItems: 'center' }}>
        <Switch value={this.state.ignoreSecretToProof} onValueChange={this.props.account.setIgnoreSecretToProof} />
        <Text style={{ marginLeft: 8 }}>ignore 'SecretToProof' (allows testing broken protocol)</Text>
      </View>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>Open Netting Channels</Text>
      {!this.props.balance || !this.state.accountsWithoutChannel ?
        <ActivityIndicator /> :
        <OpenChannel
          balance={this.props.balance}
          account={this.props.account}
          accountsWithoutChannel={this.state.accountsWithoutChannel}
        />
      }

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>Netting Channels</Text>
      {this.renderChannels()}
    </View>
  }
}
