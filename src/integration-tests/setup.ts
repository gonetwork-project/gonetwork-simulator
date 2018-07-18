import { Engine, serviceCreate, setWaitForDefault, P2P, message, as, util,
  Millisecond, fakeStorage, CHAIN_ID } from 'go-network-framework'

import * as cfgBase from './config'

export const wait = (ms: Millisecond) => new Promise(resolve => setTimeout(resolve, ms))
export const minutes = n => n * 60 * 1000

// TODO: not ideal mechanism - for test we increase block mining frequency
setWaitForDefault({ timeout: 15 * 1000, interval: 1000 })

export const setupClient = (accountIndex: number, config?: Partial<typeof cfgBase>) => {
  const cfg = Object.assign({}, cfgBase, config)
  const account = cfg.accounts[accountIndex]
  if (!account) throw new Error('NO ACCOUNT FOUND')
  const contracts = cfg.contracts

  const p2p = new P2P({
    mqttUrl: cfg.mqttUrl,
    address: account.addressStr,
    storage: fakeStorage()
  })

  const blockchain = serviceCreate({
    ...contracts,
    chainId: CHAIN_ID.GETH_PRIVATE_CHAINS,
    owner: account.address,
    signatureCb: (cb) => cb(account.privateKey),
    providerUrl: cfg.rpcUrl,
    monitoringConfig: cfg.monitoringConfig
  })

  const engine = new Engine({
    address: account.address,
    sign: (msg) => msg.sign(account.privateKey),
    send: (to, msg) => p2p.send(to.toString('hex'), message.serialize(msg)),
    blockchain: blockchain,
    settleTimeout: cfg.settleTimeout,
    revealTimeout: cfg.revealTimeout
  })

  return { contracts, p2p, engine, blockchain, owner: account, txs: blockchain.txs }
}

export const expect = (cn: boolean | Function | any) => {
  if (typeof cn === 'function') {
    try {
      cn()
    } catch (e) {
      return { toThrow: () => null, toBe: (a: true) => null }
    }
    throw new Error('Should throw')
  }

  if (!cn) throw new Error('Excpected true')

  return { toBe: (a: true) => null, toThrow: () => null }
}

export type Client = ReturnType<typeof setupClient>
