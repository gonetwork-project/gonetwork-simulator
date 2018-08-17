import { Observable } from 'rxjs'
import {
  Engine, serviceCreate, setWaitForDefault, P2P, message, as, DateMs, fakeStorage, CHAIN_ID, BN
} from 'go-network-framework'

import * as c from './config'
import { invariant } from '../global'
import { AccountBase, Contracts, Config } from './api'
import { Wei, BlockNumber } from 'eth-types'

export type Account = ReturnType<ReturnType<typeof initAccount>> extends Observable<infer U> ? U : never
export type AccountBalance = {
  blockNumber: BlockNumber
  wei: Wei
  gotToken: Wei
  hsToken: Wei
}

export enum EventSource {
  Blockchain = 1,
  P2P
}

export interface Event { at: DateMs, source: EventSource, event: any, header: string, payload: string, short: string }

const balance = (blockchain: ReturnType<typeof serviceCreate>) =>
  blockchain.monitoring.blockNumbers()
    .switchMap(bn =>
      Observable.zip(
        blockchain.contractsProxy.call.token.balanceOf({ to: blockchain.config.gotToken }, { _owner: blockchain.config.owner }),
        blockchain.contractsProxy.call.token.balanceOf({ to: blockchain.config.testToken }, { _owner: blockchain.config.owner }),
        blockchain.rpc.getBalance({ address: blockchain.config.owner }),
        (gotToken, hsToken, wei) => ({ gotToken, hsToken, wei, blockNumber: bn } as AccountBalance)
      ).take(1)
    )
    .startWith(undefined)
    .shareReplay(1)

const collectEvents = (evs: Observable<any>, name = 'N/A') =>
  evs
    // .do(x => console.log('EVENT', name, x))
    .scan((a, e) => a.concat([e]), [])
    .shareReplay(1)

const initAccount = (contracts: Contracts, cfg: Config) => (account: AccountBase) => {
  console.log('INITING-ACCOUNT', account.addressStr, cfg.runId)
  const p2p = new P2P({
    mqttUrl: cfg.urls.mqtt,
    address: account.addressStr,
    storage: fakeStorage()
  })

  const blockchain = serviceCreate({
    ...contracts,
    chainId: CHAIN_ID.GETH_PRIVATE_CHAINS,
    owner: account.address,
    signatureCb: (cb) => cb(account.privateKey),
    providerUrl: cfg.urls.eth,
    monitoringConfig: {
      startBlock: 'latest', // 'earliest' would be more appropraite to reconstruct the state, but then we need persitence
      logsInterval: cfg.blockTime // cfg.blockTime
    }
  })

  const engine = new Engine({
    address: account.address,
    sign: (msg) => msg.sign(account.privateKey),
    send: (to, msg) => p2p.send(to.toString('hex'), message.serialize(msg)),
    blockchain: blockchain,
    // todo: make if configurable - another thing is that engine assumes single value for all contracts
    settleTimeout: as.BlockNumber(6),
    revealTimeout: as.BlockNumber(3)
  })

  const events = collectEvents(Observable.merge(
    blockchain.monitoring.asStream('*').map(e => {
      const payload = JSON.stringify(
        Object.entries(e).reduce((acc, [k, v]) => {
          acc[k] = Buffer.isBuffer(v) ? '0x' + v.toString('hex') :
            BN.isBN(v) ? v.toString(10) : v
          return acc
        }, {}),
        null, 4)
      return {
        at: Date.now(),
        source: EventSource.Blockchain,
        event: e,
        header: e._type,
        payload: payload,
        short: payload
      } as Event
    }),
    Observable.fromEvent(p2p, 'message-received').map(e => {
      const payload = JSON.stringify(e, null, 4)
      return {
        at: Date.now(),
        source: EventSource.P2P,
        event: e,
        header: 'P2P',
        payload,
        short: payload.split('\n').slice(0, 4).join('\n')
      } as Event
    })
  ), 'EVENTS') as Observable<Array<Event>> // todo: improve typing

  // do not loose any event
  const eventsSub = events.subscribe()
  blockchain.monitoring.on('*', engine.onBlockchainEvent)
  p2p.on('message-received', msg => engine.onMessage(message.deserializeAndDecode(msg) as any))

  return Observable.zip(
    Observable.fromEvent(p2p, 'status-changed')
      .filter(s => s === 'connected')
      .take(1)
      .do(x => console.log('CONNECTED')),
    Observable.defer(() => blockchain.rpc.blockNumber())
      .do(x => console.log('BLOCK-NUMBER', x.toString()))
      .take(1),
    Observable.defer(() => blockchain.rpc.getBalance({ address: account.address }))
      .do(x => console.log('BALANCE', x.toString(), account.addressStr))
  )
    .mapTo({
      contracts, p2p, engine, blockchain, owner: account, txs: blockchain.txs,
      balance: balance(blockchain),
      events,
      // events: {
      //   blockchain: collectEvents(blockchain.monitoring.asStream('*'), 'BLOCKCHAIN'),
      //   p2p: collectEvents(Observable.fromEvent(p2p, 'message-received'), 'P2P'),
      //   all: collectEvents(Observable.merge(
      //     blockchain.monitoring.asStream('*').map(e => ({ type: EventType.Blockchain, event: e })),
      //     Observable.fromEvent(p2p, 'message-received').map(e => ({ type: EventType.P2P, event: e }))
      //     ), 'ALL') as Observable<{ type: EventType, event: any }>, // todo: improve typing
      //   engine: Observable.throw('TO-DO')
      // },
      dispose: () => {
        p2p.dispose()
        blockchain.monitoring.dispose()
        eventsSub.unsubscribe()
      }
    })
}

export const accounts = () => Observable.combineLatest(
  c.accounts,
  c.contractsAccount,
  c.config.filter(Boolean).map(c => c!)
)
  .debounceTime(0)
  .do(invariant(([ac, cs]) => (ac.length > 0) && !!cs, 'Contract account and at least 1 more other accounts expected'))
  .do(x => setWaitForDefault({ interval: x[2].blockTime, timeout: 3000 }))
  .do(x => console.log('INITING', x))
  .take(1)
  .mergeMap(([ac, cs, cfg]) =>
    Observable.from([cs as AccountBase].concat([ac[0]])) // just one account
      .mergeMap(initAccount(cs!.contracts, cfg))
      .toArray()
  )
  .do(x => console.log('ACC', x))
  .shareReplay(1)

const isBalanceChanged = (a: AccountBalance, b: AccountBalance) =>
  !(['gotToken', 'hsToken', 'wei'] as Array<keyof AccountBalance>).reduce((v, k) => v || !a[k].eq(b[k]), false)

export const balances = (accs: ReturnType<typeof accounts>) =>
  accs
    .mergeMap(x => x)
    .mergeMap(acc =>
      (acc.balance
        .filter(Boolean) as Observable<AccountBalance>)
        .distinctUntilChanged(isBalanceChanged)
        .startWith(undefined)
        .map(b => ({ [acc.owner.addressStr]: b }))
    )
    .scan((bs, b) => Object.assign({}, bs, b), {})
