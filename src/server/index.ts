import { Observable, Subscription } from 'rxjs'
import * as WebSocket from 'ws'
import * as fs from 'fs'

import * as P from '../protocol'

import { start as ganache } from './ganache'
import { start as mqtt } from './mqtt-nano'
import { hostname, port, accounts, tempDir } from './config'
import { execIfScript } from './utils'
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

const subprocess = <C extends { port: number, hostname: string }, T> (cfg: Partial<C>, pr: (c: C) => Observable<T>): Observable<T> =>
  Observable.race(
    Observable.timer(500).mergeMapTo(Observable.throw('FAILED')),
    pr(Object.assign(cfg as C, { port: freePort(), hostname }))
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
  return (ws.readyState === WebSocket.OPEN) && (ws.send(data) as any || true)
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

  const updateGeneral = () => {
    const state: P.GeneralInfo = {
      connected: wss.clients.size,
      active: active,
      inCreation: inCreation
    }
    const _send = send({ type: 'general', payload: state });
    (wss.clients as any as WebSocket[])
      .forEach(ws => !wsToSessions.has(ws) && _send(ws))

    console.log('UPDATE conn: ', state.connected, ' act: ', state.active.length, ' cre: ', state.inCreation.length)
  }

  const updateSession = (session: P.Session) => {
    const meta = sessionsToMeta.get(session)!

    // todo - improve - critical error anyway
    if (!meta) {
      console.log('SESSION-NOT-FOUND')
      return
    }

    const addresses = [...meta.users.values()].reduce((a, v) => a.concat(v.map(x => x.address)), [] as string[])
    meta.users.forEach((userAccounts, ws) => {
      const m: P.UserSession = Object.assign({
        userAccounts,
        addresses: addresses.filter(ad => !userAccounts.find(a => a.address === ad))
      }, session)
      send({ type: 'session', payload: m })(ws)
    })
  }

  const createAccount = (ws: WebSocket) => {
    const session = wsToSessions.get(ws)
    const meta = sessionsToMeta.get(session!)
    if (session && meta && session.canCreateAccount) {
      const accounts = meta.users.get(ws)!.concat(meta.accountsPool.splice(0, 1))
      meta.users.set(ws, accounts)

      session.canCreateAccount = meta.accountsPool.length > 0
      updateSession(session as P.Session)
      updateGeneral()
    }

  }

  const leaveSession = (ws: WebSocket) => {
    const s = wsToSessions.get(ws)
    if (s) {
      wsToSessions.delete(ws)
      const meta = sessionsToMeta.get(s)!
      meta.users.delete(ws)
      if (meta.users.size === 0) {
        active = active.filter(a => a !== s)
        sessionsToMeta.delete(s)
        meta.subscription.unsubscribe()
      } else {
        updateSession(s as P.Session)
      }
    }
    updateGeneral()
  }

  const joinSession = (ws: WebSocket, sessionId: P.SessionId, accounts = 1) => {
    const session = active.find(s => s.id === sessionId)

    if (!session) {
      console.log('Session not found', sessionId)
      updateGeneral()
      return
    }

    if (!session.canCreateAccount) {
      console.log('No more accounts')
      return
    }

    const meta = sessionsToMeta.get(session)

    // todo - improve
    if (!meta || meta.users.has(ws)) {
      console.log('Already joined')
      return
    }

    // console.log(meta, accounts)
    const userAccounts = meta.accountsPool.splice(0, accounts).filter(Boolean)
    // todo - discuss - block UI action or create new account
    if (userAccounts.length !== accounts) {
      console.log('No more accounts')
      return
    }

    session.canCreateAccount = meta.accountsPool.length > 0

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
      created: Date.now(),
      canCreateAccount: true
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
      .do(() => {
        const session = inCreation.find(_s => _s === s) as P.Session
        inCreation = inCreation.filter(_s => _s !== s)
        active.push(session)
      })
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
          return createSession(ws, (msg.payload as P.ClientRequests['create-session']))
        case 'join-session':
          return joinSession(ws, (msg.payload as P.ClientRequests['join-session']).sessionId)
        case 'leave-session':
          return leaveSession(ws)
        case 'create-account':
          return createAccount(ws)
        case 'save-events':
          fs.writeFileSync(`${tempDir}/events-${msg.payload.account}-${Date.now()}.json`, JSON.stringify(msg.payload), 'utf8')
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
