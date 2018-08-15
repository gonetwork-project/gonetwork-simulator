import * as React from 'react'
import { View, Text, Button } from 'react-native'
import { Channel } from 'go-network-framework/lib/state-channel/channel'

export interface Props {
  channel: Channel
  onSelected: () => void
}

export class ChannelShort extends React.Component<Props> {
  render () {
    const p = this.props
    const ch = p.channel
    return <View style={{ padding: 20 }}>
      <Button title='select' onPress={p.onSelected} />
      <Text>0x{ch.peerState.address.toString('hex')}</Text>
    </View>
  }
}
