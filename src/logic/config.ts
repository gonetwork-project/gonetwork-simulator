import { Observable, BehaviorSubject } from 'rxjs'
import { AsyncStorage } from 'react-native'

// todo: expose it from server project
export interface Config {
  urls: {
    coordinator: string
    mqtt: string
    eth: string
  }
  blockTime: number
}

export type Combined = typeof combined extends Observable<infer U> ? U : never

const STORAGE_KEY = 'gonetwork-server-url'

const urlSub = new BehaviorSubject<string | undefined>(undefined)
const errorSub = new BehaviorSubject<string | undefined>(undefined)

export const setServerUrl = (s?: string) => urlSub.next(s)
const updateStorage = (u: string | undefined) => u ? AsyncStorage.setItem(STORAGE_KEY, u) : AsyncStorage.removeItem(STORAGE_KEY)

export const error = errorSub.asObservable()

export const serverUrl: Observable<string | undefined> = Observable.merge(
  Observable.defer(() => AsyncStorage.getItem(STORAGE_KEY))
    .filter(Boolean)
    .do(setServerUrl),
  urlSub
    .distinctUntilChanged()
    .do(updateStorage)
    .do(() => errorSub.next(undefined))
    .shareReplay(1)
)

export const config: Observable<Config | undefined> = serverUrl
  .switchMap(u => !u
    ? Observable.of(u) :
    Observable.defer(() => fetch(`${u}/config`).then(r => r.json()))
      .catch(err => {
        errorSub.next(err.stack)
        return Observable.of(undefined)
      })
  )
  .shareReplay(1)

export const combined = Observable.combineLatest(
  serverUrl, config, error, (url, config, error) => ({ url, config, error })
)
