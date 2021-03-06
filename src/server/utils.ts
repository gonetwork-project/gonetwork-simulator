import * as os from 'os'
import * as cp from 'child_process'
import * as fs from 'fs'
import { resolve } from 'path'

import { Observable } from 'rxjs'

import { tempDir, sessionsDir, snapDir } from './config'

export const exec = Observable.bindNodeCallback(cp.exec)

// very simple mechanism to get address of ip in local network
// based on: https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
export const customStartWith = /^(192\.168)|(10\.)/
export const localIP = (startWith = customStartWith, ifaces = os.networkInterfaces()) =>
  Object.keys(ifaces)
    .map(name => ifaces[name])
    .map(iface => iface.find(a => a.family === 'IPv4'
      && startWith.test(a.address)))
    .filter(Boolean)
    .map(a => (a as os.NetworkInterfaceInfoIPv4).address)[0] as string | undefined

// running
const removeExitListeners = () => {
  process.removeAllListeners('SIGINT')
  process.removeAllListeners('uncaughtException')
}

export const autoDisposeOrRestart = (serve: () => () => void, restartOnError = false) => {
  let dispose = serve()
  process.on('SIGINT', () => {
    dispose()
    process.exit()
  })

  process.on('uncaughtException', function (e) {
    console.error('uncaughtException', e.stack)
    if (restartOnError) {
      dispose()
      setTimeout(() => {
        dispose = serve()
      }, 1000)
    } else {
      process.exit(1)
    }
  })

  return () => {
    !restartOnError && removeExitListeners()
    dispose()
  }
}

export const execIfScript = (serve: () => () => void, isScript: boolean, restartOnError = false) => {
  if (isScript) {
    let dispose = autoDisposeOrRestart(serve, restartOnError)

    process.on('SIGUSR2', () => {
      dispose()
      dispose = autoDisposeOrRestart(serve, restartOnError)
    })
  }
}

export const initSessions = () => {
  !fs.existsSync(tempDir) && fs.mkdirSync(tempDir)
  if (fs.existsSync(sessionsDir)) {
    const old = fs.readdirSync(sessionsDir)
    console.log('removing old sessions', old.length)
    Observable.from(old)
      .mergeMap(p => exec(`rm -rf ${sessionsDir}/${p}`)
        //  .do(() => console.log('removed', p))
        , 4)
      .subscribe({
        complete: () => console.log('old sessions removed')
      })
  }
}

export const initSnapshot = () => {
  !fs.existsSync(sessionsDir) && fs.mkdirSync(sessionsDir)
  if (!fs.existsSync(snapDir)) {
    const cmd = `node ${resolve(__dirname, './create-snapshot.js')}`
    console.log(`Blockchain DB snapshot not found - creating it in a blocking way now. It is only on the first run. It should take ~60 seconds. Command: "${cmd}"`)
    cp.execSync(cmd, { stdio: 'inherit' })
  }
}

export const deleteSessionFiles = (dir: string) => {
  Observable.bindNodeCallback(fs.readdir)(dir)
    .map((c: any) => c.length)
    // .delay(10000) // even after closed ganache process is still active and tries to modify the dir https://github.com/trufflesuite/ganache-core/issues/187
    .mergeMap((before) => Observable.bindNodeCallback(fs.readdir)(dir)
      .map((c: any) => console.log(`Deleting ${dir}, more files: ${c.length - before}`)))
    .mergeMap(() => exec(`rm -rf ${dir}`))
    .subscribe()
}
