import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs'
import { server } from 'ganache-core'
import { Observable, Observer } from 'rxjs'

import { Contracts } from '../protocol'

import { accounts as cfgAccounts, sessionsDir, contractsPath, snapDir } from './config'
import { initTemp, deleteSessionFiles } from './utils'

const snapNotFoundMsg = 'DB-SNAPSHOT NOT FOUND - please create by running create-snapshot script.'
// if (!fs.existsSync(snapDir)) {
//   throw new Error(snapNotFoundMsg)
// }

// SIDE EFFECTS
initTemp()

const exec = Observable.bindNodeCallback(cp.exec)

export interface GanacheInfo {
  dbPath: string
  url: string
  contracts: Contracts
}

interface Config {
  port: number
  hostname: string
  blockTime: number
}

export const start = (c: Config, dbPath = path.resolve(sessionsDir, `${Date.now()}.db`), ignoreSnapshot = false):
  Observable<GanacheInfo> =>
  Observable.concat(
    ignoreSnapshot ? Observable.empty() :
      fs.existsSync(snapDir) && fs.existsSync(contractsPath) ?
        exec(`cp -r ${snapDir} ${dbPath}`).ignoreElements()
        : Observable.throw(snapNotFoundMsg),
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
        contracts: ignoreSnapshot ? {} as any : JSON.parse(fs.readFileSync(contractsPath, 'utf8'))
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
        deleteSessionFiles(dbPath)
      })

      return () => {
        srv.close()
      }
    })
  ) as any // todo figure out why need the cast, hint remove the middle exec and all good
