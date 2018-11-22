import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import { Observable } from 'rxjs'

import rpcCreate from 'go-network-framework/lib/blockchain/rpc'
import contractsProxy from 'go-network-framework/lib/blockchain/contracts-proxy'
import { as } from 'go-network-framework'

import { Contracts } from '../protocol'

import { accounts as cfgAccounts, contractsPath, snapDir } from './config'
import { initSessions } from './utils'
import { start, GanacheInfo } from './ganache'

// needed for rpc
(global as any).fetch = require('node-fetch')

if (module.parent) {
  throw new Error('This is a script. Should not be loaded as a module / dependency.')
}

const frameworkPath = path.resolve(__dirname, '..', '..', 'node_modules/go-network-framework')
const deployScriptPath = path.resolve(frameworkPath, './build-dev/scripts/deploy-contracts.js')

const exec = Observable.bindNodeCallback(cp.exec)

const masterAccount = cfgAccounts[0]
const accounts = cfgAccounts.slice(1)
  .map(acc => ({
    privateKey: acc.secretKey,
    address: acc.address.toString('hex')
  }))

const stripHex = (o: { [P: string]: string }) =>
  Object.keys(o).reduce((acc: typeof o, k) => {
    acc[k] = o[k].substring(2)
    return acc
  }, {})

const deployContracts = (ethUrl: string) =>
  exec(`node ${deployScriptPath} ${ethUrl} ${masterAccount.address.toString('hex')}`)
    .map((r: any) => {
      return stripHex(JSON.parse(r[0])) as Contracts
    })

const distributeTokens = (url: string, contracts: Contracts) => {
  const rpc = rpcCreate(url)
  const proxy = contractsProxy({
    owner: as.Address(masterAccount.address),
    rpc,
    chainId: 1337, // todo allow passing by config
    signatureCb: (fn: any) => fn(masterAccount.privateKey)
  })

  return Observable.from(accounts)
    .concatMap(acc =>
      Observable.concat(
        proxy.txFull.token.transfer({ to: as.Address(Buffer.from(contracts.gotToken, 'hex')) },
          { _to: as.Address(Buffer.from(acc.address, 'hex')), _value: as.Wei(10000) }),
        Observable.defer(() => proxy.txFull.token.transfer({ to: as.Address(Buffer.from(contracts.testToken, 'hex')) },
          { _to: as.Address(Buffer.from(acc.address, 'hex')), _value: as.Wei(10000) }))
          .do(() => console.log('account received tokens', acc.address))
      )
    )
    .last()
}

export const createSnap = () => {
  console.log('create snap')
  return (Observable.concat(
    exec(`rm -rf ${snapDir}`).catch(() => Observable.empty()).ignoreElements(),
    exec(`mkdir ${snapDir}`).ignoreElements(),
    start({ hostname: 'localhost', port: 1884, blockTime: 500 }, snapDir, true)
  ) as Observable<GanacheInfo>)
    .mergeMap(i =>
      deployContracts(i.url)
        .do(x => console.log('contracts deployed', x))
        .do(cs => fs.writeFileSync(contractsPath, JSON.stringify(cs), 'utf8'))
        .do(x => console.log('contracts saved', x))
        .mergeMap(cs => distributeTokens(i.url, cs))
    )
    .take(1)
    .do(() => console.log('snap created'))
}

initSessions()
createSnap()
  .subscribe()
