import { Engine, serviceCreate, setWaitForDefault, P2P, message, as, util,
  Millisecond, fakeStorage, CHAIN_ID } from 'go-network-framework'
import { Buffer } from 'buffer'

import * as cfgBase from './config'

const contractsRaw = {
  'gotToken': '0x5d4f988d08fd1388f64c4d01222e9669a3eb698f',
  'testToken': '0x930c782dac097411ec02ddb2bf99776c2c614aea',
  'manager': '0x14230160c6d3cc38f4825de0a6829cf936afd5a3'
}

const contracts = Object.keys(contractsRaw)
  .reduce((acc, k) => {
    acc[k] = as.Address(new Buffer(contractsRaw[k].substring(2), 'hex'))
    return acc
  }, {}) as any

export const wait = (ms: Millisecond) => new Promise(resolve => setTimeout(resolve, ms))
export const minutes = n => n * 60 * 1000

// TODO: not ideal mechanism - for test we increase block mining frequency
setWaitForDefault({ timeout: 15 * 1000, interval: 1000 })

export const setupClient = (accountIndex: number, config?: Partial<typeof cfgBase>) => {
  const cfg = Object.assign({}, cfgBase, config)
  const account = cfg.accounts[accountIndex]
  if (!account) throw new Error('NO ACCOUNT FOUND')

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

  return { p2p, engine, blockchain, owner: account, txs: blockchain.txs }
}

export type Client = ReturnType<typeof setupClient>
