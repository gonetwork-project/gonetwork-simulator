import * as React from 'react'
import { View, Text, Button } from 'react-native'
import { Subscription } from 'rxjs'

import KeyQRScanner, { ScanStatus } from '../components/KeyQRScanner'
import * as wallet from '../logic/wallet'
import * as T from '../typings'

export interface State {
  accounts?: T.EthAccount[]
  showScanner?: boolean
}

export default class Wallet extends React.Component<{}, State> {
  state: State = {}
  sub?: Subscription

  componentDidMount () {
    wallet.accounts
      .do(accounts => this.setState({ accounts }))
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  onScanned = (s: ScanStatus, data?: string) => {
    if (s === 'success') {
      wallet.addAccount(data!)
    }
    this.setState({ showScanner: false })
  }

  renderAccounts () {
    if (this.state.accounts) {
      return this.state.accounts
        .map(a => <View key={a.address} style={{ padding: 20, margin: 20 }}>
          <Text>{a.address}</Text>
          <Button title='x' onPress={() => wallet.removeAccount(a.address)} />
        </View>)
    }
  }

  render () {
    return <View>
      {this.state.showScanner && <KeyQRScanner scanFor='private' onDone={this.onScanned} />}
      <Text>Wallet</Text>
      <Button title='Add Account' onPress={() => this.setState({ showScanner: true })} />
      {this.renderAccounts()}
    </View>
  }
}
