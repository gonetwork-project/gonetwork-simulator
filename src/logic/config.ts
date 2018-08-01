import { Observable, BehaviorSubject } from 'rxjs'
import { AsyncStorage } from 'react-native'
import { api, Config, AccountWithContracts, Account } from './api'
import { ignoreUndefined, passUndefined } from './utils'

export type Combined = typeof combined extends Observable<infer U> ? U : never

export type ServerUrl = Partial<{
  protocol: string
  hostname: string
  port: number
}>

const defaultUrl: ServerUrl = {
  protocol: 'http:',
  hostname: '192.168.1.',
  port: 5215
}

export const accountsCount = 4
const storageKey = 'gonetwork-server-url'
const urlSub = new BehaviorSubject<ServerUrl>(defaultUrl)
const errorSub = new BehaviorSubject<string | undefined>(undefined)

const updateStorage = (url: ServerUrl) => url ? AsyncStorage.setItem(storageKey, JSON.stringify(url)) : AsyncStorage.removeItem(storageKey)
const urlToStr = (url: ServerUrl) => `${url.protocol}//${url.hostname}:${url.port}`
export const setServerUrl = (url: ServerUrl) =>
  urlSub.next(Object.assign({}, urlSub.value, url))

export const reset = () => setServerUrl({})

export const error = errorSub.distinctUntilChanged()

export const serverUrl: Observable<ServerUrl> = Observable.merge(
  urlSub
    .do(() => errorSub.next(undefined))
    // .distinctUntilChanged((a, b) => a.hostname === b.hostname && a.port === b.port)
    .shareReplay(1),
  Observable.defer(() => AsyncStorage.getItem(storageKey))
    .filter(Boolean)
    .map(x => JSON.parse(x))
    .do(setServerUrl)
    .ignoreElements()
)

export const config: Observable<Config | undefined> = serverUrl
  .switchMap((u, idx) =>
    idx === 0 ? Observable.of(undefined) // 0-th / default - for sure wrong
      : Observable.defer((() => api.config(urlToStr(u))))
        .startWith(undefined)
        .timeout(500)
        .do(r => r && errorSub.next(undefined))
        .do(r => r && updateStorage(u))
        .catch(err => Observable.throw(err))
        .retryWhen(es => es.do(() => errorSub.next('CANNOT_CONNECT')).delay(250))
  )
  .shareReplay(1)

export const masterAccount = config
  .switchMap(passUndefined(c =>
    Observable.defer(() => api.default_account(c.urls.coordinator))))
  .shareReplay(1)

export const accounts: Observable<Account[]> =
  Observable.combineLatest(
    masterAccount, config
  )
    .switchMap(([ma, cfg]) =>
      !(ma && cfg) ? Observable.of([] as Account[]) :
        Observable.range(0, accountsCount - 1)
          .concatMap(() => api.account(cfg.urls.coordinator))
          .scan((acc, a) => acc.concat([a]), [])
    )
    .shareReplay(1)

export const combined = Observable.combineLatest(
  serverUrl, config, masterAccount, accounts, (url, config, masterAccount, accounts) => ({ url, config, masterAccount, accounts })
)
