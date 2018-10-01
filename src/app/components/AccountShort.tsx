import * as React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Account, AccountBalanceFormatted } from '../logic/accounts'

import { Text, H3, Button, ListItem, Right, Body } from 'native-base'

export interface Props {
  account: Account
  balance?: AccountBalanceFormatted
  onSelected?: () => void
}

export const AccountShort = (p: Props) =>
  <ListItem>
    <Body>
      <H3>0x{p.account.owner.addressStr}</H3>
      {p.balance && <Text note numberOfLines={1}>ETH: {p.balance.eth}</Text>}
      {p.balance && <Text note numberOfLines={1}>GOT: {p.balance.got}</Text>}
      {p.balance && <Text note numberOfLines={1}>ERC20: {p.balance.hs}</Text>}
    </Body>
    <Right>
      <Button transparent onPress={p.onSelected}>
        <Text>Select</Text>
      </Button>
    </Right>
  </ListItem>
