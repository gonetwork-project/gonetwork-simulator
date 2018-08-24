import { Observable, BehaviorSubject } from 'rxjs'
import { AsyncStorage } from 'react-native'

import * as pr from '../../protocol'

export interface Url {
  protocol: 'ws:' // todo: wss:
  hostname: string
  port: number
}

export type ConnectionWithStatus = WebSocket | 'idle' | 'connecting' | 'failed'

const defaultUrl: Readonly<Url> = {
  protocol: 'ws:',
  hostname: '192.168.1',
  port: 5215
}

const STORAGE_KEY = 'gonetwork-server-url'

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

const urlSub = new BehaviorSubject<Url>(defaultUrl)
export const setUrl = (url: Partial<Url>) => urlSub.next(Object.assign({}, urlSub.value, url))

export const url: Observable<Url> = Observable.merge(
  urlSub,
  Observable.defer(() => AsyncStorage.getItem(STORAGE_KEY))
    .filter(Boolean)
    .map(x => JSON.parse(x))
    .do(setUrl)
    .ignoreElements()
)

export const connectionWithStatus: Observable<ConnectionWithStatus> = url
  .switchMap((u, idx) =>
    idx === 0 ? Observable.of('idle') // 0-th / default - for sure wrong
      : Observable.defer((() => connect(urlToStr(u))))
        .startWith('connecting')
        .do(r => r && AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)))
        .catch((err) => {
          console.warn(err)
          return Observable.of('failed')
        })
        .repeatWhen(es => es.delay(2500))
  )
  .shareReplay(1) as Observable<ConnectionWithStatus>

export const connection: Observable<WebSocket | undefined> =
  connectionWithStatus
    .map(c => typeof c === 'string' ? undefined : c)