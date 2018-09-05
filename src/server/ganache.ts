import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import { server } from 'ganache-core'
import { Observable, Observer } from 'rxjs'

import { Contracts } from '../protocol'

import rpcCreate from 'go-network-framework/lib/blockchain/rpc'
import contractsProxy from 'go-network-framework/lib/blockchain/contracts-proxy'
import { as, Millisecond } from 'go-network-framework'

import { accounts as cfgAccounts } from './config'

interface GanacheInfo {
  dbPath: string
  url: string
  contracts: Contracts
}

interface Config {
  port: number
  hostname: string
  blockTime: Millisecond
}

(global as any).fetch = require('node-fetch')
const exec = Observable.bindNodeCallback(cp.exec)

const tempDir = path.resolve(__dirname, '../../temp')
const snapDir = path.resolve(tempDir, 'db-snap')
const sessionsDir = path.resolve(tempDir, 'db-sessions')
const contractsPath = path.resolve(snapDir, 'contracts.json')

const deployScriptPath = path.resolve(__dirname, '../../node_modules/go-network-framework/build-dev/scripts/deploy-contracts.js')

const masterAccount = cfgAccounts[0]
const accounts = cfgAccounts.slice(1)
  .map(acc => ({
    privateKey: acc.secretKey,
    address: acc.address.toString('hex')
  }))

!fs.existsSync(tempDir) && fs.mkdirSync(tempDir)
if (fs.existsSync(sessionsDir)) {
  console.log('removing old sessions')
  Observable.from(fs.readdirSync(sessionsDir))
    .mergeMap(p => exec(`rm -rf ${sessionsDir}/${p}`), 3)
    .subscribe({
      complete: () => console.log('old sessions removed')
    })
}
!fs.existsSync(sessionsDir) && fs.mkdirSync(sessionsDir)

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

export const start = (c: Config, ignoreSnap = false, dbPath = path.resolve(sessionsDir, `${Date.now()}.db`)):
  Observable<GanacheInfo> =>
  Observable.concat(
    !ignoreSnap && fs.existsSync(snapDir) && fs.existsSync(contractsPath) ?
      exec(`cp -r ${snapDir} ${dbPath}`).ignoreElements() : // todo - check if path exists
      ignoreSnap ? Observable.empty() :
        createSnap({ port: 1884, hostname: 'localhost', blockTime: 200 })
          .ignoreElements() as any,
    Observable.create((obs: Observer<GanacheInfo>) => {
      const options = {
        port: c.port,
        hostname: c.hostname,

        blockTime: c.blockTime / 1000,
        db_path: dbPath,

        // logger: console,
        locked: false,
        // mnemonic: 'dignity upset visa worry warrior donate record enforce time pledge ladder drop',
        accounts: cfgAccounts,
        gasPrice: 200

      }

      const info: GanacheInfo = {
        dbPath,
        url: `http://${options.hostname}:${options.port}`,
        contracts: ignoreSnap ? {} as any : JSON.parse(fs.readFileSync(contractsPath, 'utf8'))
      }

      const srv = new server(options)
      srv.listen(options.port, options.hostname, (err: any) => {
        if (err) {
          console.error(err)
          // process.exit(1)
          obs.error(err)
        }
        console.log(`Ganache listening on ${info.url}, db-path: ${info.dbPath}`)
        obs.next(info)
      })

      srv.on('close', () => {
        console.log(`Ganache closed url: ${info.url}, db-path: ${info.dbPath}`)
      })

      return () => {
        srv.close()
      }
    })
  ) as any // todo figure out why need the cast, hint remove the middle exec and all good

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
          .do(x => console.log('account received tokens', acc.address))
      )
    )
    .last()
}

export const createSnap = (c: Config) => {
  console.log('create snap')
  return (Observable.concat(
    exec(`rm -rf ${snapDir}`).catch(() => Observable.empty()).ignoreElements(),
    exec(`mkdir ${snapDir}`).ignoreElements(),
    start(c as any, true, snapDir)
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

if (!module.parent) {
  start({ hostname: 'localhost', port: 1884, blockTime: 500 })
    .do(x => console.log('V', x))
    .subscribe()
}
