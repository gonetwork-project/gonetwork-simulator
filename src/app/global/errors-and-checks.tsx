import { BehaviorSubject, Observable } from 'rxjs'
import { View, Text, Button } from 'react-native'
import * as React from 'react'

import { checkP2PRaw } from '../logic/check-p2p'

// #region critical errors

/*
  Singleton module for handling critical errors.
  The underlying assumption is that after a critical error the application needs to re-initialize.
*/

export type ErrorType = 'p2p-test-failed' | 'connection-lost' | 'unknown' | InvariantError

export type InvariantError = 'invariant'

const internal = 'Oops, we are sorry - it should not happen... This is an internal error - it requires additional investigation.'
export const errorsConfig: { [K in ErrorType]: { header: string, message: string } } = {
  'p2p-test-failed': {
    header: 'MQTT server unreachable',
    message: 'MQTT server should be started automatically. It requires a websocket connection. Test uses url provided by main service, so connection with main service was successful.'
  },
  'connection-lost': {
    header: 'Connection to Simulator Server lost',
    message: 'You will need to reconnect and most likely all state has been lost'
  },
  'unknown': {
    header: 'Unknown / Runtime error',
    message: internal
  },
  'invariant': {
    header: 'Invariant broken',
    message: internal
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

// #region checks
export const checkP2P = (url: string) =>
  checkP2PRaw(url)
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

export const CriticalError = (p: ErrorProps) => {
  console.error(p)
  return <View style={{ padding: 20, backgroundColor: 'rgba(200, 20, 20, 0.2)' }}>
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
}
// #endregion
