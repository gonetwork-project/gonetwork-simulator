import * as React from 'react'
import { Subscription } from 'rxjs'
import { ScrollView, Text, View, Button } from 'react-native'

import { Account, Event, EventSource } from '../logic/accounts'

export interface Props {
  account: Account
  onClose: () => void
}

export interface State {
  events: Array<Event> // todo: improve typing
}

export class Events extends React.Component<Props, State> {
  state: State = {
    events: []
  }
  scroll?: ScrollView
  sub?: Subscription

  componentDidMount () {
    this.sub = this.props.account.events
      .do(ev => this.setState({ events: ev }))
      .delay(500)
      .do(() => this.scroll && this.scroll.scrollToEnd())
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  render () {
    const evs = this.state.events
    return <ScrollView ref={s => (this.scroll as any) = s}>
      <Button title='Close' onPress={this.props.onClose} />
      <Text style={{ margin: 20, fontSize: 20, fontWeight: 'bold' }}>Events received by: 0x{this.props.account.owner.addressStr}</Text>
      <Text style={{ margin: 20, fontSize: 18, fontWeight: 'bold' }}>Total: {evs.length}</Text>

      {evs.map((e, i) =>
        <View key={i} style={{ padding: 20, margin: 4, backgroundColor: e.source === EventSource.Blockchain ?
          'rgba(0, 128, 0, 0.1)' : 'rgba(0, 0, 128, 0.1)' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{e.header}</Text>
          <Text>{e.short}</Text>
        </View>)}

    </ScrollView>
  }

}
