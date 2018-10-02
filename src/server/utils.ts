import * as os from 'os'
import * as cp from 'child_process'
import * as fs from 'fs'

import { Observable } from 'rxjs'

import { tempDir, sessionsDir } from './config'

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

export const autoDispose = (dispose: () => void) => {
  process.on('SIGINT', () => {
    dispose()
    process.exit()
  })

  process.on('uncaughtException', function (e) {
    console.log(e.stack)
    process.exit(1)
  })

  return () => {
    removeExitListeners()
    dispose()
  }
}

export const execIfScript = (serve: () => () => void, isScript: boolean) => {
  if (isScript) {
    let dispose = autoDispose(serve())

    process.on('SIGUSR2', () => {
      dispose()
      dispose = autoDispose(serve())
    })
  }
}

export const initTemp = () => {
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
  !fs.existsSync(sessionsDir) && fs.mkdirSync(sessionsDir)
}

export const deleteSessionFiles = (dir: string) => cp.exec(`rm -rf ${dir}`, () => console.log('DELETED', dir))
