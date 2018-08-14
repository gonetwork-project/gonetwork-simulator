import * as React from 'react'
import { View, Text, Button, ActivityIndicator } from 'react-native'
import { Account, AccountBalance } from '../logic/accounts'
import { Address } from 'eth-types'

export interface Props {
  account: Account
  otherAccounts: Array<{ address: Address, addressStr: string }>
  balance?: AccountBalance
  onBack: () => void
}

export class AccountDetailed extends React.Component<Props> {

  render () {
    const p = this.props
    return <View style={{ padding: 20 }}>
      <Button title='back' onPress={p.onBack} />
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>0x{p.account.owner.addressStr}</Text>
      {
        !p.balance ?
          <ActivityIndicator size='small' /> :
          <Text>{JSON.stringify(p.balance, null, 4)}</Text>
      }
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Netting Channels</Text>
      <ActivityIndicator size='small' />
    </View>
  }
}
