import * as React from 'react'
import { ActivityIndicator, AsyncStorage } from 'react-native'
import { Observable, Subscription } from 'rxjs'

import { clearStorage } from '../logic/utils'
import { accounts, otherAccounts, balances, Account, AccountBalanceFormatted, OtherAccount } from '../logic/accounts'
import { send, session } from '../logic/setup'

import { AccountShort } from '../components/AccountShort'
import { AccountFull } from '../components/AccountFull'
import { BlockNumber } from 'eth-types'
import { UserSession } from '../../protocol'
import { Footer, Text, FooterTab, Container, Button, Header, Title, Body, Left, Icon, Right, Subtitle, Content, List } from 'native-base'

export interface State {
  currentBlock?: BlockNumber
  accounts?: Account[]
  session?: UserSession,
  otherAccounts?: OtherAccount[]
  balances: {
    [K: string]: AccountBalanceFormatted | undefined
  },
  isAddingAccount: boolean
  selectedAccount?: Account
}

export class Main extends React.Component<{}, State> {
  state: State = {
    balances: {},
    isAddingAccount: false
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
        .do(acc => this.setState({ otherAccounts: acc, isAddingAccount: false })),
      session.do(s => this.setState({ session: s })),
      balances(accs).do(balances => this.setState({ balances })),
      accs
        .mergeMap(as => as[0].blockchain.monitoring.blockNumbers())
        .do(b => this.setState({ currentBlock: b }))
    )
      .retryWhen(errs => errs
        .do(x => console.warn('ERR', x))
        .delay(1000)
      )
      .subscribe({
        error: err => {
          // todo: investigate why sometimes it throws
          console.log(this.state)
          console.warn(err)
        }
      })
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
    this.state.accounts && this.state.accounts.forEach(a => {
      console.log('DISPOSING', a.owner.addressStr)
      a.dispose()
    })
  }

  leaveSession = () => {
    this.sub && this.sub.unsubscribe()
    send('leave-session', undefined)
  }

  addAccount = () => {
    this.setState({ isAddingAccount: true })
    send('create-account', undefined)
  }

  sendEvents = () =>
    Observable.from(this.state.accounts!
      .map(a => ({ account: a.owner.addressStr, events: a.events })))
      .mergeMap(({ account, events }) =>
        events.take(1)
          .do(es => send('save-events', { account, events: es }))
          .do(es => AsyncStorage.setItem(`EVENTS-${account}`, JSON.stringify(es)))
      )
      .toPromise()

  canAddAccount = (s?: UserSession, accounts?: Account[]) =>
    s && accounts && s.canCreateAccount && accounts.length < 4

  renderAccounts = () => <Content>
    <List>
      {
        this.state.accounts ?
          this.state.accounts.map((a, i) =>
            <AccountShort
              key={a.owner.addressStr}
              account={a}
              balance={this.state.balances[a.owner.addressStr]}
              onSelected={() => this.setState({ selectedAccount: a })}
            />) :
          <ActivityIndicator />
      }
    </List>
    {this.state.isAddingAccount ?
      <ActivityIndicator /> :
      <Button primary transparent style={{ alignSelf: 'center' }}
        disabled={!this.canAddAccount(this.state.session, this.state.accounts)} onPress={this.addAccount}>
        <Text>Add Account</Text>
      </Button>}
  </Content>

  render () {
    const selected = this.state.selectedAccount
    if (selected) {
      return <AccountFull
        currentBlock={this.state.currentBlock!}
        account={selected}
        balance={this.state.balances[selected.owner.addressStr]}
        otherAccounts={this.state.accounts!
          .filter(a => a !== selected)
          .map(a => Object.assign({}, a.owner, { local: a }) as OtherAccount) // more info passed than needed
          .concat(this.state.otherAccounts || [])
        }
        onBack={() => this.setState({ selectedAccount: undefined })
        }
      />
    }

    return <Container>

      <Header>
        <Left>
          <Button transparent onPress={this.leaveSession}>
            <Icon name='arrow-back' />
          </Button>
        </Left>
        <Body>
          <Title>Accounts</Title>
          {this.state.currentBlock && <Subtitle>Block: {this.state.currentBlock.toString(10)}</Subtitle>}
        </Body>
        <Right>
        </Right>
      </Header>

      {this.renderAccounts()}

      <Footer>
        <FooterTab>
          <Button vertical info transparent onPress={clearStorage} ><Text>Clear-Cache</Text></Button>
          <Button vertical info transparent disabled={!this.state.accounts} onPress={this.sendEvents}><Text>Save-Events</Text></Button>
        </FooterTab>
      </Footer>
    </Container >
  }
}
