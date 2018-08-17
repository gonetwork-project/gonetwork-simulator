import * as React from 'react'
import { Subscription } from 'rxjs'
import { View, Text, Button, Modal, Alert } from 'react-native'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { as } from 'go-network-framework'
import { Wei } from 'eth-types'

import { sendDirect, sendMediated } from '../logic/offchain-actions'
import { Account } from '../logic/accounts'

export const State = (p: Channel['myState'] | Channel['peerState']) =>
  <View style={{ paddingLeft: 12 }}>
    <Text>Initial Deposit: {p.depositBalance.toString(10)}</Text>
    <Text>Transferred Amount: {p.transferredAmount.toString(10)}</Text>
    <Text>Nonce: {p.nonce.toString(10)}</Text>
  </View>

export interface Props {
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

  close = () => {
    Alert.alert('CLOSING')
  }

  render () {
    const p = this.props
    const ch = p.channel
    return <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row' }}>
        <Button title='Close' onPress={this.close} />
        <Button title='Send Direct (50)' onPress={this.sendDirect} />
        <Button title='Send Mediated (50)' onPress={this.sendMediated} />
      </View>
      <Text>Channel Address: 0x{ch.channelAddress.toString('hex')}</Text>
      <Text>Peer Address: 0x{ch.peerState.address.toString('hex')}</Text>
      <Text>State: {ch.state}</Text>
      <Text>Opened Block: {ch.openedBlock.toString(10)}</Text>

      <Text style={{ fontWeight: 'bold' }}>Peer State</Text>
      {State(ch.peerState)}

      <Text style={{ fontWeight: 'bold' }}>Account State</Text>
      {State(ch.myState)}

    </View>
  }
}
