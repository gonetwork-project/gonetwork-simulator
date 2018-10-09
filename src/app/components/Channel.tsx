import * as React from 'react'
import { Subscription, BehaviorSubject, Observable } from 'rxjs'
import { View, Alert, Button as ButtonRN, ActivityIndicator, LayoutAnimation } from 'react-native'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { as, BN } from 'go-network-framework'
import { Wei, BlockNumber } from 'eth-types'
import { Card, CardItem, Text, Button, Body, Item, Label, Input } from 'native-base'

import { sendDirect, sendMediated } from '../logic/offchain-actions'
import { Account } from '../logic/accounts'

interface Lock {
  expiration: BlockNumber
  amount: Wei
  secret: string
  hashLock: Buffer
}

export const OpenLock = (lock: Lock, index: number) =>
  <View key={lock.secret} style={{ paddingLeft: 4 }}>
    <Text style={{ fontWeight: 'bold' }}>{index}.</Text>
    <Text>Expiration: {lock.expiration.toString(10)}</Text>
    <Text>Amount: {lock.amount.toString(10)}</Text>
  </View>

export const ChannelState = (ch: Channel, block: BlockNumber) => {
  const acc = ch.myState
  const peer = ch.peerState
  const openLocks = Object.values(peer.openLocks)
  return <View style={{ width: '100%', height: 120, marginBottom: 8, justifyContent: 'space-between', flexDirection: 'row' }}>
    <View style={{ width: '30%', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      <Text style={{ height: 20 }}></Text>
      <Text note>balance</Text>
      <Text note>deposit</Text>
      <Text note>transferred</Text>
      <Text note>nonce</Text>
      <Text note>open locks #</Text>
    </View>

    <View style={{ width: '30%', justifyContent: 'space-around', alignItems: 'center' }}>
      <Text style={{ fontWeight: 'bold' }}>account</Text>
      <Text>{ch.transferrable().toString(10)}</Text>
      <Text>{acc.depositBalance.toString(10)}</Text>
      <Text>{acc.transferredAmount.toString(10)}</Text>
      <Text>{acc.nonce.toString(10)}</Text>
      <Text note>N/A</Text>
    </View>

    <View style={{ width: '30%', justifyContent: 'space-around', alignItems: 'center' }}>
      <Text style={{ fontWeight: 'bold' }}>peer</Text>
      <Text>{ch.transferrableFromTo(peer, acc, block).toString(10)}</Text>
      <Text>{peer.depositBalance.toString(10)}</Text>
      <Text>{peer.transferredAmount.toString(10)}</Text>
      <Text>{peer.nonce.toString(10)}</Text>
      <Text>{openLocks.length}</Text>
    </View>
  </View>
}

export interface Props {
  currentBlock: BlockNumber
  account: Account
  channel: Channel
  onSelected: () => void
}

export interface State {
  more?: boolean
  amount?: Wei
  error?: string
}

export class ChannelComp extends React.Component<Props, State> {
  sub?: Subscription
  errorSub = new BehaviorSubject<any | undefined>(undefined)
  state: State = {}

  componentDidMount () {
    this.sub = this.errorSub.switchMap(e =>
      Observable.of(undefined).delay(5000).startWith(e))
      .do(e => this.updateState({ error: e && (e.message || 'Unknown Error') }))
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  updateState = (s: Partial<State>) => {
    this.setState(s)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  sendDirect = () => {
    sendDirect(this.props.account, this.props.channel.peerState.address,
      this.props.channel.myState.transferredAmount.add(this.state.amount!) as Wei)
      .then(() => this.updateState({ amount: undefined }))
      .catch((e) => this.errorSub.next(e))
  }

  sendMediated = () => {
    sendMediated(this.props.account, this.props.channel.peerState.address, this.state.amount!)
      .then(() => this.updateState({ amount: undefined }))
      .catch((e) => this.errorSub.next(e))
  }

  close = () =>
    this.props.account.engine.closeChannel(this.props.channel.channelAddress)
      .then(x => console.log('CLOSED', x))

  withdraw = () =>
    this.props.account.engine.withdrawPeerOpenLocks(this.props.channel.channelAddress)
      .then(() => Alert.alert('Open Locks withdrawn - success'))

  settle = () => {
    this.props.account.engine.settleChannel(this.props.channel.channelAddress)
    this.forceUpdate()
  }

  renderToggle = () =>
    <View>
      <Button onPress={() => this.updateState({ more: !this.state.more })} transparent style={{ alignSelf: 'flex-end' }}>
        <Text style={{ fontSize: 12 }}>[{this.state.more ? '-' : '+'}]</Text>
      </Button>
    </View>

  renderVisibile = () => {
    const ch = this.props.channel
    switch (ch.state) {
      case 'opened':
        return <View style={{
          flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'space-between',
          minHeight: 40, marginBottom: this.state.error ? 0 : 8
        }}>

          <Item floatingLabel style={{ maxWidth: '30%' }}>
            <Label>Amount</Label>
            <Input
              value={this.state.amount ? this.state.amount.toString(10) : ''}
              onChangeText={t => this.setState({ amount: parseInt(t, 10) ? as.Wei(parseInt(t, 10)) : undefined })}
              keyboardType='number-pad'
            />
          </Item>

          <View style={{ alignItems: 'center' }}>
            <Text note>Send Transfer</Text>
            <View style={{ flexDirection: 'row' }}>
              <Button disabled={!this.state.amount} transparent onPress={this.sendDirect}>
                <Text>Direct</Text>
              </Button>
              <Button disabled={!this.state.amount} transparent onPress={this.sendMediated}>
                <Text>Mediated</Text>
              </Button>
            </View>
          </View>

          {this.renderToggle()}

        </View>

      case 'closed':
        const toSettle = ch.closedBlock!.add(this.props.account.engine.settleTimeout).sub(this.props.currentBlock)
        const canSettle = toSettle.lte(new BN(0))
        const canWithdraw = Object.keys(ch.peerState.openLocks).length > 0
        return <View style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {canWithdraw ?
            <Button disabled={!canWithdraw} onPress={this.withdraw}>
              <Text>Withdraw Open Locks</Text>
            </Button> :
            <Text note>No open locks to withdraw.</Text>
          }
          {
            canSettle ?
              <Button onPress={this.settle}>
                <Text>Settle</Text>
              </Button> :
              <Text>Settle possible in {toSettle.toString(10)}</Text>
          }

          {this.renderToggle()}
        </View>

      case 'settled':
        return <View style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text note>
            Channel settled. [TODO] remove/create-new
          </Text>
          {this.renderToggle()}
        </View>

      default:
        return <View style={{ minHeight: 40, alignSelf: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text note>{ch.state}</Text>
        </View>
    }
  }

  renderMore = (ch = this.props.channel) =>
    this.state.more && <View style={{ width: '100%' }}>
      {ChannelState(ch, this.props.currentBlock)}
      <Text note>State</Text>
      <Text style={{ fontSize: 14 }}>{ch.state}</Text>
      <Text note>Channel Address</Text>
      <Text style={{ fontSize: 14 }}>0x{ch.channelAddress.toString('hex')}</Text>
      {
        ch.state === 'opened' &&
        <Button bordered danger onPress={this.close} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
          <Text>Close</Text>
        </Button>
      }
    </View>

  render () {
    const ch = this.props.channel
    return <Card style={{ padding: 8 }}>
      <CardItem header>
        <Text ellipsizeMode='middle' numberOfLines={1}>0x{ch.peerState.address.toString('hex')}</Text>
      </CardItem>
      <Body style={{ alignItems: 'flex-start', alignSelf: 'stretch' }}>
        {this.renderVisibile()}
        {this.state.error &&
          <Text style={{ padding: 8, color: 'red' }}>{this.state.error}</Text>
        }
        {this.renderMore()}
      </Body>
    </Card>
  }
}
