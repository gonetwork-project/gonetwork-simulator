import * as React from 'react'
import { View, Text, Button, ActivityIndicator } from 'react-native'
import { Account, AccountBalance } from '../logic/accounts'

export interface Props {
  account: Account
  balance?: AccountBalance
  onSelected?: () => void
}

export const AccountShort = (p: Props) =>
  <View style={{ padding: 20, marginVertical: 5, backgroundColor: 'rgba(200,200,200,0.2)' }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>0x{p.account.owner.addressStr}</Text>
    {p.onSelected && <Button title='select' onPress={p.onSelected} />}
    {
      !p.balance ?
        <ActivityIndicator size='small' /> :
        <Text>{JSON.stringify(p.balance, null, 4)}</Text>
    }
  </View>
