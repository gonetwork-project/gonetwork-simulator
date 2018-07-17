import * as React from 'react'
import { View, Text } from 'react-native'
import { Observable } from 'rxjs'

import * as flowsOff from './flows-offchain'
import * as flowsOn from './flows-onchain'

import { as, message } from 'go-network-framework'

import { setupClient, wait, expect } from './setup'

const run = () => {
  const c1 = setupClient(0)
  const c2 = setupClient(5)

  const sub = Observable.from([c1, c2])
    .mergeMap((c, idx) => c.blockchain.monitoring.protocolErrors()
      .do(errs => console.warn(`Client-${idx} PROTOCOL-ERRORS ${errs.length}`))
      .do(errs => console.warn(...errs.map(e => e.stack!.split('\n')).map(e => e[0] + '\n' + e[1])))
    ).subscribe()

  c1.blockchain.monitoring.on('*', c1.engine.onBlockchainEvent)
  c2.blockchain.monitoring.on('*', c2.engine.onBlockchainEvent)
  // c1.blockchain.monitoring.on('*', msg => console.log('C1 <--   ', msg))
  // c2.blockchain.monitoring.on('*', msg => console.log('   --> C2', msg))

  c1.p2p.on('message-received', msg => c1.engine.onMessage(message.deserializeAndDecode(msg) as any))
  c2.p2p.on('message-received', msg => c2.engine.onMessage(message.deserializeAndDecode(msg) as any))
  // c1.p2p.on('message-received', msg => console.log('C1 <--   ', (deserializeAndDecode(msg) as any).classType))
  // c2.p2p.on('message-received', msg => console.log('   -->  C2', (deserializeAndDecode(msg) as any).classType))

  flowsOn.createChannelAndDeposit(c1, c2, as.Wei(500))
    .then(x => console.log('CREATED', x))
    .then(() => wait(5000))
    .then(() => console.log('CHECKPOINT - after contract creation', c1, c2))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(0), c2, as.Wei(0))).toBe(true))
    .then(() => console.log('CHECKPOINT - before direct'))
    .then(flowsOff.sendDirect(c1, c2, as.Wei(200)))
    .then(() => console.log('CHECKPOINT - after direct'))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(200), c2, as.Wei(0))).toBe(true))
    .then(flowsOff.sendMediated(c2, c1, as.Wei(50)))
    .then(flowsOff.sendMediated(c2, c1, as.Wei(50)))
    .then(() => console.log('CHECKPOINT'))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(200), c2, as.Wei(100))).toBe(true))
    .then(() => expect(() => flowsOff.sendDirect(c2, c1, as.Wei(201))()).toThrow())
    .then(flowsOff.sendDirect(c2, c1, as.Wei(150)))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(200), c2, as.Wei(150))).toBe(true))
    .then(flowsOff.sendMediated(c2, c1, as.Wei(50)))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(200), c2, as.Wei(200))).toBe(true))
    .then(flowsOff.sendMediated(c1, c2, as.Wei(50)))
    .then(flowsOff.sendMediated(c1, c2, as.Wei(50)))
    .then(flowsOff.sendMediated(c1, c2, as.Wei(50)))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(350), c2, as.Wei(200))).toBe(true))
    .then(() => Promise.all([
      flowsOff.sendMediated(c1, c2, as.Wei(100))(),
      flowsOff.sendDirect(c2, c1, as.Wei(250))()
    ]))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(450), c2, as.Wei(250))).toBe(true))
    .then(() => Promise.all([
      flowsOff.sendDirect(c1, c2, as.Wei(500))(),
      flowsOff.sendMediated(c2, c1, as.Wei(50))()
    ]))
    .then(() => expect(flowsOff.transferredEqual(c1, as.Wei(500), c2, as.Wei(300))).toBe(true))
    .then(() => flowsOn.closeChannel(c1, c2, 2))
    .then(flowsOn.checkBalances(as.Wei(200), as.Wei(500)))
    .then(() => console.log('ALL_GOOD!!'))
}

run()

export default class IntegrationTest extends React.Component {

  render () {
    return <View style={{ paddingTop: 56 }}>
      <Text>Integration Test</Text>
    </View>
  }
}
