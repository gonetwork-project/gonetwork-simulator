import { Observable, BehaviorSubject } from 'rxjs'
import { AsyncStorage } from 'react-native'

import { ServerMessage, GeneralInfo, UserSession, SessionConfigClient, ClientRequests } from '../../protocol'
import { passUndefined } from './utils'
import { as } from 'go-network-framework'

export interface Url {
  protocol: 'ws:' // todo: wss:
  hostname: string
  port: number
}

export type ConnectionWithStatus = WebSocket | 'idle' | 'connecting' | 'failed'

export const defaultBlockTime = 500
export const minBlockTime = 100
export const timeouts = {
  settle: as.BlockNumber(51),
  reveal: as.BlockNumber(50),
  collateral: as.BlockNumber(50)
}

const defaultUrl: Readonly<Url> = {
  protocol: 'ws:',
  hostname: '192.168.1',
  port: 5215
}

const STORAGE_KEY_URL = 'setup::gonetwork-server-url'

const urlToStr = (url: Url) => `${url.protocol}//${url.hostname}:${url.port}`

const connect = (url: string) =>
  Observable.create(obs => {
    const ws = new WebSocket(url)
    ws.onopen = () => obs.next(ws)

    // todo: differantiate between regular and critical errors
    // ws.onerror = (err) => obs.error(err)
    ws.onclose = (x) => obs.error(x)
    return () => ws.close()
  }) as Observable<any>

const sessionConfigSub = new BehaviorSubject<SessionConfigClient>({ blockTime: defaultBlockTime })
export const setSessionConfig = (c: Partial<SessionConfigClient>) => sessionConfigSub.next(Object.assign({}, sessionConfigSub.value, c))
export const sessionConfig = sessionConfigSub.asObservable()

const urlSub = new BehaviorSubject<Url>(defaultUrl)
export const setUrl = (url: Partial<Url>) => urlSub.next(Object.assign({}, urlSub.value, url))
export const url: Observable<Url> = Observable.merge(
  urlSub,
  Observable.defer(() => AsyncStorage.getItem(STORAGE_KEY_URL))
    .filter(Boolean)
    .map(x => JSON.parse(x!))
    .do(setUrl)
    .ignoreElements()
)

export const connectionWithStatus: Observable<ConnectionWithStatus> = url
  .switchMap((u, idx) =>
    idx === 0 ? Observable.of('idle') // 0-th / default - for sure wrong
      : Observable.defer((() => connect(urlToStr(u))))
        .startWith('connecting')
        .do(r => r && AsyncStorage.setItem(STORAGE_KEY_URL, JSON.stringify(u)))
        .catch(() => {
          // console.warn(err)
          return Observable.of('failed')
        })
        .repeatWhen(es => es.delay(2500))
  )
  .shareReplay(1) as Observable<ConnectionWithStatus>

export const connection: Observable<WebSocket | undefined> =
  connectionWithStatus
    .map(c => typeof c === 'string' ? undefined : c)

export const send = <A extends keyof ClientRequests> (action: A, payload: ClientRequests[A]) =>
  connection
    .take(1)
    .do(ws => ws && ws.send(JSON.stringify({ type: action, payload })))
    .subscribe()

export const messages = connection
  .switchMap(passUndefined(c =>
    Observable.fromEvent(c, 'message')
      .map((m: any) => JSON.parse(m.data)))
    // .do(x => console.log('MSG', x)))
  ).shareReplay(1) as Observable<undefined | ServerMessage>

export const generalInfo: Observable<GeneralInfo | undefined> = messages
  .switchMap(passUndefined(m =>
    m.type === 'general' ? Observable.of(m.payload) : Observable.of(undefined)
  ))
  .do(x => x && console.log('GENERAL', x))
  .shareReplay(1)

export const session: Observable<UserSession | undefined> = messages
  .switchMap(passUndefined(m =>
    m.type === 'session' ? Observable.of(m.payload) : Observable.of(undefined)
  ))
  // .do(x => console.log('SESSION', x))
  .shareReplay(1)
