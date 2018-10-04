import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { Account, AccountBalanceFormatted } from '../logic/accounts'

import { Text, H3, Button, ListItem, Right, Body } from 'native-base'

import { Balance } from './Balance'

export interface Props {
  account: Account
  balance?: AccountBalanceFormatted
  onSelected?: () => void
}

export const AccountShort = (p: Props) =>
  <ListItem>
    <Body>
      <Text style={{ fontWeight: 'bold' }}>{p.account.owner.addressShort}</Text>
      {p.balance ?
        Balance({ balance: p.balance, direction: 'vertical' }) :
        <ActivityIndicator />
      }
    </Body>
    <Right>
      <Button transparent onPress={p.onSelected}>
        <Text>Select</Text>
      </Button>
    </Right>
  </ListItem>
