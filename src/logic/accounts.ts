import { Observable } from 'rxjs'
import {
  Engine, serviceCreate, setWaitForDefault, P2P, message, as, util,
  Millisecond, fakeStorage, CHAIN_ID, MonitoringConfig, BlockchainServiceConfig
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

const initAccount = (contracts: Contracts, cfg: Config) => (account: AccountBase) => {
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
      startBlock: 'latest',
      logsInterval: cfg.blockTime // cfg.blockTime
    }
  })

  const engine = new Engine({
    address: account.address,
    sign: (msg) => msg.sign(account.privateKey),
    send: (to, msg) => p2p.send(to.toString('hex'), message.serialize(msg)),
    blockchain: blockchain,
    settleTimeout: as.BlockNumber(6),
    revealTimeout: as.BlockNumber(3)
  })

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
    .mapTo({ contracts, p2p, engine, blockchain, owner: account, txs: blockchain.txs,
      balance: balance(blockchain)
    })
}

export const accounts = Observable.combineLatest(
  c.accounts,
  c.contractsAccount,
  c.config.filter(Boolean).map(c => c!)
)
  .do(invariant(([ac, cs]) => ac.length >= 1 && !!cs, 'Contract account and at least 1 more other accounts expected'))
  .do(x => setWaitForDefault({ interval: x[2].blockTime, timeout: 3000 }))
  .switchMap(([ac, cs, cfg]) =>
    Observable.from([cs as AccountBase].concat([ac[0]])) // just one account
      .mergeMap(initAccount(cs!.contracts, cfg))
      .toArray()
  )
  .do(x => console.log('ACC', x))
  .shareReplay(1)

const isBalanceChanged = (a?: AccountBalance, b?: AccountBalance) =>
  !!(a && b && (['gotToken', 'hsToken', 'wei'] as Array<keyof AccountBalance>).reduce((v, k) => v || a[k].eq(b[k]), false))

export const balances = accounts
  .mergeMap(x => x)
  .mergeMap(acc =>
    acc.balance
      // .do(x => console.log('BALANCE', x))
      .distinctUntilChanged(isBalanceChanged)
      .map(b => ({ [acc.owner.addressStr]: b }))
  )
  .scan((bs, b) => Object.assign({}, bs, b), {})
