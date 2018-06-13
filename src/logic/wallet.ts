import { AsyncStorage } from 'react-native'
import { BehaviorSubject, Subject, Observable } from 'rxjs'
import * as util from 'ethereumjs-util'
import * as keychain from 'react-native-keychain'

import * as T from '../typings'

const STORAGE_KEY = 'wallet-public-info'

const accountsSub = new BehaviorSubject<T.EthAccount[] | undefined>(undefined)

const loadAccounts = () =>
  Observable.defer(() => AsyncStorage.getItem(STORAGE_KEY))
    .map(acc => JSON.parse(acc || '[]'))
    .do(acc => accountsSub.next(acc))
    .do(acc => console.log('ACCOUNTS', acc))
    .retryWhen(errs => errs.delay(1000))

export const accounts = accountsSub.asObservable()

// todo: should not be needed
// export const getAccountsSync = () => accountsSub.value || []

// todo: discuss
export const addAccount = (privateKey: string): Promise<boolean> => {
  if (util.isValidPrivate(util.toBuffer(privateKey))) {
    const address = util.bufferToHex(util.privateToAddress(util.toBuffer(privateKey)))
    const current = accountsSub.value || []
    if (current.find(a => a.address === address)) {
      return Promise.resolve(false)
    }
    const accounts = current.concat([{
      address,
      amount: 0 // todo: monitoring
    }])
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
      .then(() => keychain.setGenericPassword('', privateKey, {
        service: address // is it only accessible from the app itself (?)
      }))
      .then(() => accountsSub.next(accounts))
      .then(() => true)
      .catch(() => false)
  }
  return Promise.resolve(false)
}

export const removeAccount = (address: string): Promise<boolean> => {
  const current = accountsSub.value || []
  const removed = current.filter(a => a.address !== address)
  if (removed.length === current.length) {
    return Promise.resolve(false)
  } else {
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(removed))
      .then(() => accountsSub.next(removed))
      .then(() => true)
      .catch(() => false)
  }
}

export const unlockAccount = (publicKey: string): Promise<boolean> => {
  return Promise.resolve(false)
}

export const lockAccount = (publicKey: string): Promise<boolean> => {
  return Promise.resolve(false)
}

// todo: add monitoring of balances
export const init = () => {
  return null
}

// temporarily here
loadAccounts()
  .subscribe()
