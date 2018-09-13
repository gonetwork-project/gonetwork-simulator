import * as React from 'react'
import { View, Text, Button, Alert } from 'react-native'
import { Observable, Subscription } from 'rxjs'

import { clearStorage } from '../logic/utils'
import { accounts, otherAccounts, balances, Account, AccountBalance, OtherAccount } from '../logic/accounts'
import { send } from '../logic/setup'

import { AccountShort } from '../components/AccountShort'
import { AccountFull } from '../components/AccountFull'
import { BlockNumber } from 'eth-types'

export interface Props {
  sessionId: string
}

export interface State {
  currentBlock?: BlockNumber
  accounts?: Account[]
  otherAccounts?: OtherAccount[]
  balances: {
    [K: string]: AccountBalance | undefined
  }
  selectedAccount?: Account
}

export class Main extends React.Component<Props, State> {
  state: State = {
    balances: {}
  }
  sub!: Subscription

  componentDidMount () {
    const accs = accounts()
    this.sub = Observable.merge(
      accs
        .do(acc => this.setState({
          selectedAccount: acc[0], // TODO comment out
          accounts: acc
        })),
      otherAccounts()
        .do(acc => this.setState({ otherAccounts: acc })),
      balances(accs).do(balances => this.setState({ balances })),
      accs
        .mergeMap(as => as[0].blockchain.monitoring.blockNumbers())
        .do(b => this.setState({ currentBlock: b }))
    )
      .subscribe({
        error: err => console.warn(err)
      })
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
    this.state.accounts && this.state.accounts.forEach(a => {
      console.log('DISPOSING', a.owner.addressStr)
      a.dispose()
    })
  }

  leaveSession = () => send('leave-session', { sessionId: this.props.sessionId })

  renderAccounts = () => ([
    <Button key='l' title='Leave Session' onPress={this.leaveSession} />,
    <Text key='b'>Current Block: {this.state.currentBlock && this.state.currentBlock.toString(10) || '...'}</Text>,
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
        currentBlock={this.state.currentBlock!}
        account={selected}
        balance={this.state.balances[selected.owner.addressStr]}
        otherAccounts={this.state.accounts!
          .filter(a => a !== selected)
          .map(a => a.owner as OtherAccount) // more info passed than needed
          .concat(this.state.otherAccounts || [])
        }
        onBack={() => this.setState({ selectedAccount: undefined })}
      />}

      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Dev Actions</Text>
      <View style={{ padding: 20, flexDirection: 'row' }}>
        <Button onPress={clearStorage} title='Clear-Cache' />
      </View>

    </View>
  }
}
