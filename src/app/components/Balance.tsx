
import * as React from 'react'
import { View } from 'react-native'
import { AccountBalanceFormatted } from '../logic/accounts'

import { Text, Card } from 'native-base'

interface ItemProps {
  direction: 'vertical' | 'horizontal',
  currency: string,
  value: string,
  delta?: string
}

const Item = ({ direction, currency, value, delta }: ItemProps) =>
  <View style={{ padding: 4, flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: (direction === 'vertical' && 50) || undefined, alignItems: 'flex-end',
      marginRight: 4 }}>
      <Text note>{currency}</Text>
    </View>
    <View style={{ alignItems: 'flex-start' }}>
      {delta && <Text style={{ fontSize: 10,
        color: delta[0] === '-' ? 'red' : 'green' }}>{delta}</Text>}
      <Text>{value}</Text>
    </View>
  </View>

export interface Props {
  balance: AccountBalanceFormatted,
  direction: 'vertical' | 'horizontal'
}

export const Balance = ({ balance, direction }: Props) =>
  <Card transparent={direction === 'vertical'} style={{ minHeight: 48, flexDirection: direction === 'vertical' ? 'column' : 'row',
    justifyContent: 'space-around', padding: 4 }}>
    <Item direction={direction} currency='ETH' value={balance.eth} delta={balance.delta.eth} />
    <Item direction={direction} currency='GOT' value={balance.got} delta={balance.delta.got} />
    <Item direction={direction} currency='ERC20' value={balance.hs} delta={balance.delta.hs} />
  </Card>
