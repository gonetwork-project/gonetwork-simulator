import * as React from 'react'
import { View, Text, Button } from 'react-native'
import { Observable, Subscription } from 'rxjs'

import { clearStorage } from '../logic/utils'
import { accounts, balances, Account, AccountBalance } from '../logic/accounts'
import { restart } from '../global'

export type State = {
  accounts?: Account[]
  balances: {
    [K: string]: AccountBalance | undefined
  }
}

export class Main extends React.Component<{}, State> {
  state: State = {
    balances: {}
  }
  sub!: Subscription

  componentDidMount () {
    this.sub = Observable.merge(
      accounts.do(acc => this.setState({ accounts: acc })),
      balances.do(balances => this.setState({ balances }))
    )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderAccounts = (accounts: Account[]) => {
    return accounts.map((a, i) => {
      const b = this.state.balances[a.owner.addressStr]
      return <View key={i} style={{ padding: 20 }}>
        <Text>Address: 0x{a.owner.addressStr}</Text>
        <Text>{JSON.stringify(b, null, 4)}</Text>
      </View>
    })
  }

  render () {
    return <View>

      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Accounts</Text>
      <View style={{ padding: 20 }}>
        {
          this.state.accounts ? this.renderAccounts(this.state.accounts) :
            <Text>...initializig...</Text>
        }
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dev Actions</Text>
      <View style={{ padding: 20, flexDirection: 'row' }}>
        <Button onPress={clearStorage} title='Clear-Cache' />
        <Button onPress={restart} title='Restart' />
      </View>

    </View>
  }
}
