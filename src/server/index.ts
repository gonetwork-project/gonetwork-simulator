import { Observable, Subscription } from 'rxjs'
import * as WebSocket from 'ws'
import { execIfScript } from 'go-network-framework/build-dev'

import * as P from '../protocol'

import { start as ganache } from './ganache'
import { start as mqtt } from './mqtt-nano'
import { hostname, port, accounts } from './config'

interface SessionMeta {
  subscription: Subscription
  users: Map<WebSocket, P.Account[]>
  accountsPool: P.Account[]
}

// technically it does not have to be free
let _freePort = 2222
const freePort = () => {
  _freePort = (_freePort + 1)
  if (_freePort === 50000) {
    _freePort = 2222
  }
  return _freePort
}

let sessionId = 0

const subprocess = <C extends { port: number, hostname: string }, T> (cfg: any, pr: (c: C) => Observable<T>): Observable<T> =>
  Observable.race(
    Observable.timer(500).mergeMapTo(Observable.throw('FAILED')),
    pr(Object.assign(cfg, { port: freePort(), hostname }))
  )
    .retryWhen(es => es.switchMap(e => e === 'FAILED' ?
      Observable.of(true) : Observable.throw(e)))

const send = (msg: P.ServerMessage) => (ws: WebSocket): boolean => {
  const data = JSON.stringify(msg)
  return ws.readyState === WebSocket.OPEN && (ws.send(data) || true)
}

const serve = () => {
  let active: P.Session[] = []
  let inCreation: Array<Partial<P.Session>> = []
  const wsToSessions = new Map<WebSocket, Partial<P.Session>>()
  const sessionsToMeta = new Map<Partial<P.Session>, SessionMeta>()

  const wss = new WebSocket.Server({
    host: hostname,
    port: port
  })

  const updateGeneral = (clients?: WebSocket[]) => {
    const state: P.GeneralInfo = {
      connected: wss.clients.size,
      active: active,
      inCreation: inCreation
    }
    const _send = send({ type: 'general', payload: state });
    (clients || wss.clients as any as WebSocket[])
      .forEach(ws => !wsToSessions.has(ws) && _send(ws))

    console.log('UPDATE conn: ', state.connected, ' act: ', state.active.length, ' cre: ', state.inCreation.length)
  }

  const updateSession = (session: P.Session) => {
    const meta = sessionsToMeta.get(session)!

    // todo - improve - critical error anyway
    // if (!meta) return

    const accounts = [...meta.users.values()].reduce((a, v) => a.concat(v), [])
    const s: P.Session = Object.assign({ accounts }, session)
    meta.users.forEach((userAccounts, ws) => {
      const m: P.UserSession = Object.assign({ userAccounts }, s)
      send({ type: 'session', payload: m })(ws)
    })
  }

  const leaveSession = (ws: WebSocket, s = wsToSessions.get(ws)) => () => {
    if (s) {
      wsToSessions.delete(ws)
      const meta = sessionsToMeta.get(s)!
      if (meta.users.size === 0) {
        sessionsToMeta.delete(s)
        meta.subscription.unsubscribe()
      }
    }
    updateGeneral([ws])
  }

  const joinSession = (ws: WebSocket, session: P.Session, accounts = 1) => {
    inCreation = inCreation.filter(s => s !== session)
    active.push(session)
    const meta = sessionsToMeta.get(session)

    // todo - improve
    if (!meta || meta.users.has(ws)) return

    const userAccounts = meta.accountsPool.slice(2).filter(Boolean)
    // todo - discuss - block UI action or create new account
    if (userAccounts.length !== accounts) return

    meta.users.set(ws, userAccounts)
    wsToSessions.set(ws, session)

    updateGeneral()
    updateSession(session)
  }

  const createSession = (ws: WebSocket, c: P.SessionConfigClient) => {
    const s: Partial<P.Session> = {
      id: `${++sessionId}`,
      created: Date.now()
    }
    inCreation = inCreation.concat(s)
    const sub = Observable.zip(
      subprocess(c, ganache).do(g => {
        s.contracts = g.contracts
        s.blockTime = c.blockTime
        s.mqttUrl = g.url
      })
        .do(() => updateGeneral()),
      subprocess({}, mqtt)
        .do(c => s.mqttUrl = c.url)
        .do(() => updateGeneral())
    )
      .do(() => joinSession(ws, s as any as P.Session, 2))
      .subscribe()

    updateGeneral()
    const meta: SessionMeta = {
      subscription: sub,
      accountsPool: accounts.slice(2).map(a => ({ privateKey: a.secretKey, address: a.address.toString('hex') })),
      users: new Map()
    }

    wsToSessions.set(ws, s)
    sessionsToMeta.set(s, meta)
  }

  wss.on('connection', ws => {
    updateGeneral()

    ws.on('close', () => updateGeneral())

    // todo: fix types
    ws.on('message', (data: any) => {
      console.log('MSG', data)
      switch (data.type as P.ClientAction) {
        case 'create-session':
          return createSession(ws, data.payload)
        case 'leave-session':
          return leaveSession(ws)
      }
    })
  })

  wss.on('listening', () => {
    console.log(`Simulator Server listening on ws://${hostname}:${port}`)
  })

  wss.on('error', (error) => {
    console.error('CRITICAL ERROR')
    console.error(error)
    process.exit(1)
  })

  return () => {
    console.log('Closing Simulator Server')
    wss.close()
  }
}

execIfScript(serve, !module.parent)
