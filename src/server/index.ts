import { Observable, Subscription } from 'rxjs'
import * as WebSocket from 'ws'
import { execIfScript } from 'go-network-framework/build-dev'

import * as P from '../protocol'

import { start as ganache } from './ganache'
import { start as mqtt } from './mqtt-nano'
import { hostname, port, accounts } from './config'

interface SessionMeta {
  createdBy: WebSocket
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
const PINGING_INTERVAL = 1000

const subprocess = <C extends { port: number, hostname: string }, T> (cfg: any, pr: (c: C) => Observable<T>): Observable<T> =>
  Observable.race(
    Observable.timer(500).mergeMapTo(Observable.throw('FAILED')),
    pr(Object.assign(cfg, { port: freePort(), hostname }))
  )
    .retryWhen(es => es.switchMap(e => e === 'FAILED' ?
      Observable.of(true) : Observable.throw(e)))

const pinging = (wss: WebSocket.Server) => Observable.interval(PINGING_INTERVAL)
  .do(() =>
    wss.clients
      .forEach(ws => {
        if (!(ws as any).alive) {
          ws.terminate()
        }
        (ws as any).alive = false
        ws.readyState === ws.OPEN && ws.ping()
      })
  )

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

  const jobsSub = pinging(wss).subscribe()

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

  const leaveSession = (ws: WebSocket) => {
    const s = wsToSessions.get(ws)
    if (s) {
      wsToSessions.delete(ws)
      active = active.filter(a => a !== s)
      const meta = sessionsToMeta.get(s)!
      meta.users.delete(ws)
      if (meta.users.size === 0) {
        sessionsToMeta.delete(s)
        meta.subscription.unsubscribe()
      }
    }
    updateGeneral([ws])
  }

  const joinSession = (ws: WebSocket, sessionId: P.SessionId, accounts = 1) => {
    const session = inCreation.find(s => s.id === sessionId) as P.Session
    inCreation = inCreation.filter(s => s.id !== sessionId)
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
    console.log('JOINED', wsToSessions.size, sessionsToMeta.size)
  }

  const createSession = (ws: WebSocket, c: P.SessionConfigClient) => {
    if ([...sessionsToMeta.values()].find(m => m.createdBy === ws)) {
      console.log('Already in session')
      return
    }

    const s: Partial<P.Session> = {
      id: `${++sessionId}`,
      created: Date.now()
    }

    inCreation = inCreation.concat(s)
    const sub = Observable.zip(
      subprocess(Object.assign({ blockTime: 1000 }, c), ganache)
        .do(g => {
          s.contracts = g.contracts
          s.blockTime = c.blockTime
          s.ethUrl = g.url
        })
        .do(() => updateGeneral()),
      subprocess({}, mqtt)
        .do(c => s.mqttUrl = c.url)
        .do(() => updateGeneral())
    )
      .do(() => joinSession(ws, s.id!, 2))
      .finally(() => console.log('SESSION-ENDED', s.id))
      .subscribe({
        next: s => console.log('SESSION-CREATED', s),
        error: err => console.error(err)
      })

    console.log('CREATE-UPDATE')
    updateGeneral()
    const meta: SessionMeta = {
      createdBy: ws,
      subscription: sub,
      accountsPool: accounts.slice(2).map(a => ({ privateKey: a.secretKey.substring(2), address: a.address.toString('hex') })),
      users: new Map()
    }

    sessionsToMeta.set(s, meta)
  }

  wss.on('connection', ws => {
    updateGeneral();

    (ws as any).alive = true
    ws.on('pong', () => (ws as any).alive = true)

    ws.on('close', () => {
      console.log('SOCKET-CLOSE')
      leaveSession(ws)
    })

    ws.on('error', () => {
      console.log('SOCKET-ERROR')
      leaveSession(ws)
    })

    // todo: fix types
    ws.on('message', (data: any) => {
      const msg = JSON.parse(data)
      console.log('msg', msg)
      switch (msg.type as P.ClientAction) {
        case 'create-session':
          return createSession(ws, msg.payload || { blockTime: 1000 })
        case 'leave-session':
          return leaveSession(ws)
        case 'join-session':
          return joinSession(ws, msg.payload)
        case 'create-account':
          return console.log('CREATE-ACCOUNT-TODO', msg)
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
    jobsSub.unsubscribe()
    wss.close()
  }
}

execIfScript(serve, !module.parent)
