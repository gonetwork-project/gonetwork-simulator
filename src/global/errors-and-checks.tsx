import { BehaviorSubject, Observable } from 'rxjs'
import { View, Text, Button } from 'react-native'
import * as React from 'react'

import { api } from '../logic/api'
import { config } from '../logic/config'
import { ignoreUndefined, passUndefined } from '../logic/utils'
import { checkP2PRaw } from '../logic/check-p2p'

// #region critical errors

/*
  Singleton module for handling critical errors.
  The underlying assumption is that after a critical error the application needs to re-initialize.
*/

export type ErrorType = 'server-unreachable' | 'p2p-test-failed' | 'unknown' | 'restart' | InvariantError

export type InvariantError = 'invariant'

const internal = 'Oops, we are sorry - it should not happen... This is an internal error - it requires additional investigation.'
export const errorsConfig: { [K in ErrorType]: { header: string, message: string } } = {
  'p2p-test-failed': {
    header: 'MQTT server unreachable',
    message: 'MQTT server should be started automatically. It requires a websocket connection. Test uses url provided by main service, so connection with main service was successful.'
  },

  'server-unreachable': {
    header: 'Server Unreachable',
    message: 'Server does not offer any persistence. The application must be re-initialized.'
  },
  'unknown': {
    header: 'Unknown / Runtime error',
    message: internal
  },
  'invariant': {
    header: 'Invariant broken',
    message: internal
  },
  // technically that is not an error
  'restart': {
    header: '...restarting...',
    message: ''
  }
}

const errorsSub = new BehaviorSubject<{ type: ErrorType, error?: Error } | undefined>(undefined)

const setError = (type: ErrorType | undefined, error?: Error) => errorsSub.next(type && { type, error })
const clearError = () => errorsSub.next(undefined)

export const errors = errorsSub.asObservable()
export const setUnknownError = (error: Error) => errorsSub.next({ type: 'unknown', error })
interface CheckInvariant {
  <T> (check: (p: T) => boolean, msg?: string): (p: T) => void
}
export const invariant: CheckInvariant = (check, msg = '[More Info not specifed]') => p =>
  !check(p) && setError('invariant', new Error(msg)) || p

export const restart = () => {
  config
    .switchMap(ignoreUndefined(c =>
      Observable.defer(() => api.restart(c.urls.coordinator))))
    .mapTo('restart' as ErrorType)
    // sometimes - the network request fails
    .catch(() => Observable.of('server-unreachable' as ErrorType))
    .do((s) => setError(s))
    .take(1)
    .mergeMapTo(
      Observable.timer(1000)
        .do(clearError)
    )
    .subscribe({
      error: err => console.log('RESTART-ERROR', err)
    })
}
// #endregion

// #region monitoring
export const monitorServer: Observable<ErrorType> = config
  .switchMap(ignoreUndefined(c =>
    Observable.interval(500)
      .switchMap(() => api.run_id(c.urls.coordinator))
      // .do(x => console.log('SERVER-MONITOR', x))
      .filter(Boolean)
      .distinctUntilChanged()
      .skip(1)
      .catch(() => Observable.of(true))
      .mapTo('server-unreachable' as ErrorType)
  ))

export const monitorErrors = Observable.merge(
  monitorServer
)
  // .do(x => console.warn('CRITICAL_ERROR', x))
  .do(setError)
  .takeUntil(errors.filter(Boolean)) // upon error all monitoring stopped
// #endregion

// #region checks
export const checkP2P = config.switchMap(
  ignoreUndefined(c => checkP2PRaw(c.urls.mqtt)))
  .catch(() => Observable.of(false)
    .do(() => setError('p2p-test-failed'))
  )
  .startWith(false)

// #endregion

// #region component
export interface ErrorProps {
  type: ErrorType
  error?: Error
}

export const CriticalError = (p: ErrorProps) =>
  <View style={{ padding: 20, backgroundColor: 'rgba(200, 20, 20, 0.2)' }}>
    <Text style={{ fontSize: 26, marginBottom: 20, fontWeight: 'bold', color: 'rgb(200,20,20)' }}>{errorsConfig[p.type].header}</Text>
    <Text style={{ fontSize: 14, marginBottom: 20, fontWeight: 'bold', color: 'rgba(200,20,20, 0.9)' }}>{errorsConfig[p.type].message}</Text>

    {
      p.error && p.error.message &&
      <Text style={{ marginTop: 20, fontWeight: 'bold', fontSize: 20 }}>
        {p.error.message}
      </Text>
    }

    {
      p.error &&
      <Text style={{ marginTop: 20 }}>
        {JSON.stringify(p.error.stack)}
      </Text>
    }
    <Button onPress={clearError} title='Re-initialize' />
  </View>
// #endregion
