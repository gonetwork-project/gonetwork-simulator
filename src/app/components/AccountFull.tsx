import * as React from 'react'
import { ActivityIndicator, Modal, LayoutAnimation } from 'react-native'
import { Subscription, Observable } from 'rxjs'
import { Container, Content, Header, Left, Button, Body, Text, Subtitle, Title, Icon, Right } from 'native-base'

import { BlockNumber } from 'eth-types'
import { Channel } from 'go-network-framework/lib/state-channel/channel'
import { Account, AccountBalanceFormatted, OtherAccount } from '../logic/accounts'
import { OpenChannel } from './OpenChannel'
import { Messages } from './Messages'
import { ChannelComp } from './Channel'
import { Balance } from './Balance'

export interface Props {
  account: Account
  otherAccounts: OtherAccount[]
  currentBlock?: BlockNumber
  balance?: AccountBalanceFormatted
  onBack: () => void
}

export interface State {
  accountsWithoutChannel?: OtherAccount[]
  selectedChannel?: any
  channels?: Channel[]
  showEvents?: boolean
  showOpenChannel?: boolean
  showMessages?: boolean
}

export const getAccountsWithoutChannel = (channels?: Channel[], other?: OtherAccount[]) =>
  channels && other && other.filter(o => !channels.find(ch => o.address.compare(ch.peerState.address) === 0 && ch.state !== 'settled'))

export class AccountFull extends React.Component<Props, State> {
  state: State = {}

  sub?: Subscription

  componentDidMount () {
    this.sub = Observable.merge(
      this.props.account.blockchain.monitoring
        .asStream('*')
        .startWith(true as any)
        .map(() => Object.values(this.props.account.engine.channels))
        .do(() => LayoutAnimation.configureNext(LayoutAnimation.Presets.spring))
        .do((channels) => this.setState({
          channels,
          accountsWithoutChannel: getAccountsWithoutChannel(channels, this.props.otherAccounts)
        }))
    )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderChannels = () => {
    const cs = this.state.channels
    if (!cs) return <ActivityIndicator />
    if (cs.length === 0) return <Text>No openned channels.</Text>
    return cs.map(ch => <ChannelComp
      key={ch.peerState.address.toString('hex')}
      currentBlock={this.props.currentBlock!}
      account={this.props.account}
      channel={ch} onSelected={() => console.log('SELECTED')} />)
  }

  render () {
    const p = this.props
    const canOpenChannel = this.state.accountsWithoutChannel && this.state.accountsWithoutChannel.length > 0
    const manual = p.account.p2pProxy.getMode() === 'manual'
    return <Container>

      {this.state.showOpenChannel && <Modal
        animationType='slide'
        supportedOrientations={['portrait']}
        onDismiss={() => this.setState({ showOpenChannel: false })}>
        <OpenChannel
          account={this.props.account}
          accountsWithoutChannel={this.state.accountsWithoutChannel!}
          balance={this.props.balance!}
          onDone={() => this.setState({ showOpenChannel: false })}
        />
      </Modal>}

      {this.state.showMessages && <Modal
        animationType='slide'
        supportedOrientations={['portrait']}
        onDismiss={() => this.setState({ showMessages: false })}>
        <Messages
          account={this.props.account}
          onDone={() => this.setState({ showMessages: false })}
        />
      </Modal>}

      <Header>
        <Left>
          <Button transparent onPress={p.onBack}>
            <Icon name='arrow-back' />
          </Button>
        </Left>
        <Body>
          <Title>0x{p.account.owner.addressStr}</Title>
          {this.props.currentBlock && <Subtitle>Block: {this.props.currentBlock.toString(10)}</Subtitle>}
        </Body>
        <Right>
          <Button transparent onPress={() => this.setState({ showMessages: true })}>
            <Icon name='send' />
            {manual && <Text style={{ fontSize: 12, paddingLeft: 4, color: 'orange' }}>
              ({p.account.p2pProxy.messages.value.length})</Text>}
          </Button>
        </Right>
      </Header>

      <Content padder>
        {
          !p.balance ?
            <ActivityIndicator size='small' /> :
            Balance({ balance: p.balance, direction: 'horizontal' })
        }

        <Button disabled={!canOpenChannel} style={{
          marginTop: 18,
          marginBottom: canOpenChannel ? 18 : 0, alignSelf: 'center'
        }}
          onPress={() => this.setState({ showOpenChannel: true })}>
          <Text>Open Channel</Text>
        </Button>
        {!canOpenChannel && <Text style={{ marginBottom: canOpenChannel ? 18 : 0, alignSelf: 'center' }}
          note>No accounts without active channel available.</Text>}

        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>Netting Channels</Text>
        {this.renderChannels()}
      </Content>
    </Container>
  }
}
