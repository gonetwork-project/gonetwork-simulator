import * as React from 'react'
import { Event, EventSource } from '../logic/accounts'
import { Observable } from 'rxjs'

import { Container, Header, Footer, Text, Content, Card, H3, View } from 'native-base'
import { AsyncStorage, Dimensions } from 'react-native'

const color1 = 'rgba(0, 200, 0, 0.1)'
const color2 = 'rgba(0, 0, 200, 0.1)'

interface State {
  account1: string,
  account2: string
  events: Array<{ account: 0 | 1, event: Event }>
}

export class EventsVis extends React.Component<{}, State> {

  componentDidMount () {
    Observable.defer(() => AsyncStorage.getAllKeys())
      .mergeMap(ks =>
        Observable.from(ks)
          .filter(k => k.startsWith('EVENTS-'))
          .take(2)
          .map((k, i) => ([k, k.replace('EVENTS-', ''), i]))
          .mergeMap(([key, account, idx]) => Observable.defer(() => AsyncStorage.getItem(key as string))
            .do(() => idx === 0 ? this.setState({ account1: account as string }) : this.setState({ account2: account as string }))
            .map(e => JSON.parse(e!))
            .map(es => es.map(e => ({ account: idx, event: e })))
            .mergeMap(x => x)
          )
          .toArray()
          .do(es => es.sort((a: any, b: any) => a.event.at - b.event.at))
          .do(es => this.setState({ events: es as any }))
      )
      .toPromise()
  }

  renderEvents = () => {
    const screen = Dimensions.get('screen').width
    const width = Math.floor(screen * 0.7)
    const padding = Math.floor(screen - width - 10)
    const es = this.state.events
    if (!es) return <Text>...</Text>
    // console.log(es)
    console.log(screen, width, padding, es[0].account)
    return es.map((e, i) => <View key={i} style={{ width: screen, marginTop: 4, flexDirection: 'row' }}>
      {e.account === 1 && <View style={{ width: padding }} />}
      <Card key={i} style={{
        width, padding: 4, alignSelf: e.account === 1 ? 'flex-end' : 'flex-start',
        backgroundColor: e.account === 0 ? color1 : color2
      }}>
        <Text style={{ fontSize: 10, opacity: 0.7 }}>{e.event.source === EventSource.Blockchain ? 'blockchain' : 'peer-to-peer'}</Text>
        <H3>{e.event.event._type}</H3>
      </Card>
    </View>)
  }

  render () {
    if (!this.state) return null
    return <Container>
      <Header style={{ backgroundColor: color1 }}><Text>0x{this.state.account1}</Text></Header>
      <Content>{this.renderEvents()}</Content>
      <Footer style={{ backgroundColor: color2 }}><Text>0x{this.state.account2}</Text></Footer>
    </Container>
  }
}
