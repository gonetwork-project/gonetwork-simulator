
import * as React from 'react'
import { View } from 'react-native'
import { AccountBalanceFormatted } from '../logic/accounts'

import { Text } from 'native-base'

export interface Props {
  balance: AccountBalanceFormatted,
  direction?: 'row' | 'column'
}

export const Balance = ({ balance, direction }: Props) =>
  <View style={{ flexDirection: direction || 'column', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
    <View style={{ flex: 1, padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end', marginRight: direction === 'row' ? 4 : 0 }}>
        <Text note>ETH</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{balance.eth}</Text>
      </View>
    </View>
    <View style={{ flex: 1, padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end', marginRight: direction === 'row' ? 4 : 0 }}>
        <Text note>GOT</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{balance.got}</Text>
      </View>
    </View>
    <View style={{ flex: 1, padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end', marginRight: direction === 'row' ? 4 : 0 }}>
        <Text note>ERC20</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{balance.hs}</Text>
      </View>
    </View>
  </View>
