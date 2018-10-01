import * as React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Account, AccountBalanceFormatted } from '../logic/accounts'

import { Text, H3, Button, ListItem, Right, Body } from 'native-base'

export interface Props {
  account: Account
  balance?: AccountBalanceFormatted
  onSelected?: () => void
}

const renderBalance = (bl: AccountBalanceFormatted) =>
  <View>
    <View style={{ padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end' }}>
        <Text note>ETH</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{bl.eth}</Text>
      </View>
    </View>
    <View style={{ padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end' }}>
        <Text note>GOT</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{bl.got}</Text>
      </View>
    </View>
    <View style={{ padding: 4, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 100, alignItems: 'flex-end' }}>
        <Text note>ERC20</Text>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <Text >{bl.hs}</Text>
      </View>
    </View>
  </View>

export const AccountShort = (p: Props) =>
  <ListItem>
    <Body>
      <H3>0x{p.account.owner.addressStr}</H3>
      {p.balance ?
        renderBalance(p.balance) :
        <ActivityIndicator />
      }
    </Body>
    <Right>
      <Button transparent onPress={p.onSelected}>
        <Text>Select</Text>
      </Button>
    </Right>
  </ListItem>
