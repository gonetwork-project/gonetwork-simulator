import * as React from 'react'
import { Subscription } from 'rxjs'
import { View, Text, Button, Alert, ActivityIndicator } from 'react-native'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { as } from 'go-network-framework'
import { Wei, BlockNumber } from 'eth-types'

import { sendDirect, sendMediated } from '../logic/offchain-actions'
import { Account } from '../logic/accounts'

export const State = (p: Channel['myState'] | Channel['peerState']) =>
  <View style={{ paddingLeft: 12 }}>
    <Text>Initial Deposit: {p.depositBalance.toString(10)}</Text>
    <Text>Transferred Amount: {p.transferredAmount.toString(10)}</Text>
    <Text>Nonce: {p.nonce.toString(10)}</Text>
  </View>

export interface Props {
  currentBlock: BlockNumber
  account: Account
  channel: Channel
  onSelected: () => void
}

export class ChannelShort extends React.Component<Props> {
  sub?: Subscription

  sendDirect = () => {
    sendDirect(this.props.account, this.props.channel.peerState.address,
      this.props.channel.myState.transferredAmount.add(as.Wei(50)) as Wei)
      .then(() => this.forceUpdate())
  }

  sendMediated = () => {
    sendMediated(this.props.account, this.props.channel.peerState.address, as.Wei(50))
      .then(() => this.forceUpdate())
  }

  close = () =>
    this.props.account.engine.closeChannel(this.props.channel.channelAddress)
      .then(x => console.log('CLOSED', x))

  withdraw = () =>
    this.props.account.engine.withdrawPeerOpenLocks(this.props.channel.channelAddress)
      .then(() => Alert.alert('Open Locks withdrawn - success'))

  settle = () =>
    this.props.account.engine.settleChannel(this.props.channel.channelAddress)

  renderActions = () => {
    const ch = this.props.channel

    if (ch.peerState.depositBalance.toNumber() === 0 && ch.myState.depositBalance.toNumber() === 0) {
      return <Text>...waiting for deposit...</Text>
    }

    switch (ch.state) {
      case 'opened': return [
        <Button key='c' title='Close' onPress={this.close} />,
        <Button key='d' title='Send Direct (50)' onPress={this.sendDirect} />,
        <Button key='m' title='Send Mediated (50)' onPress={this.sendMediated} />
      ]
      case 'closed': return [
        <Button key='w' title='Withdraw Peer Open Locks' onPress={this.withdraw} />,
        <Button key='s' title='Settle' onPress={this.settle} />
      ]
      case 'settled': return <Text>Settled - no more actions available</Text>
      default:
        return <ActivityIndicator />
    }
  }

  render () {
    const p = this.props
    const ch = p.channel
    return <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row' }}>
        {this.renderActions()}
      </View>
      <Text>State: {ch.state}</Text>
      <Text>Channel Address: 0x{ch.channelAddress.toString('hex')}</Text>
      <Text>Peer Address: 0x{ch.peerState.address.toString('hex')}</Text>
      <Text>Opened Block: {ch.openedBlock.toString(10)}</Text>

      <Text style={{ fontWeight: 'bold' }}>Peer State</Text>
      {State(ch.peerState)}
      <Text>Open Locks Count: {Object.values(ch.peerState.openLocks).length}</Text>

      <Text style={{ fontWeight: 'bold' }}>Account State</Text>
      {State(ch.myState)}

    </View>
  }
}
