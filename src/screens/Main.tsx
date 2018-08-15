import * as React from 'react'
import { View, Text, Button, Alert } from 'react-native'
import { Observable, Subscription } from 'rxjs'

import { clearStorage } from '../logic/utils'
import { accounts, balances, Account, AccountBalance } from '../logic/accounts'
import { restart } from '../global'

import { AccountShort } from '../components/AccountShort'
import { AccountFull } from '../components/AccountFull'

export type State = {
  accounts?: Account[]
  balances: {
    [K: string]: AccountBalance | undefined
  }
  selectedAccount?: Account
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

  renderAccounts = () => ([
    <Text key='h' style={{ fontSize: 24, fontWeight: 'bold' }}>Accounts</Text>,
    <View key='a' style={{ padding: 20 }}>
      {
        this.state.accounts ?
          this.state.accounts.map((a, i) =>
            <AccountShort
              key={a.owner.addressStr}
              account={a}
              balance={this.state.balances[a.owner.addressStr]}
              onSelected={() => this.setState({ selectedAccount: a })}
            />) :
          <Text>...initializig...</Text>
      }
    </View>
  ])

  render () {
    const selected = this.state.selectedAccount
    return <View>

      {!selected && this.renderAccounts()}
      {selected && <AccountFull
        account={selected}
        balance={this.state.balances[selected.owner.addressStr]}
        otherAccounts={this.state.accounts!
          .filter(a => a !== selected)
          .map(a => a.owner)
        }
        onBack={() => this.setState({ selectedAccount: undefined })}
      />}

      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dev Actions</Text>
      <View style={{ padding: 20, flexDirection: 'row' }}>
        <Button onPress={clearStorage} title='Clear-Cache' />
        <Button onPress={restart} title='Restart' />
      </View>

    </View>
  }
}
