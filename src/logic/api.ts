// todo: expose it from server project or move server project to this repo

import { PrivateKey, Address } from 'eth-types'
import { util, as } from '../../node_modules/go-network-framework'

export interface Config {
  urls: {
    coordinator: string
    mqtt: string
    eth: string
  }
  blockTime: number
}

export interface Contracts {
  manager: Address
  gotToken: Address
  testToken: Address
}

export interface Account {
  privateKey: PrivateKey
  privateKeyStr: string
  address: Address
  addressStr: string
}

export interface AccountWithContracts extends Account {
  contracts: Contracts
}

export type AsRequest<In, Out> = In extends void ?
  (serverUrl: string) => Promise<Out> : (serverUrl: string, c: In) => Promise<Out>

export type Command<In, Out> = [In, Out] // input, output
export type ApiIO = {
  config: [void, Config]
  account: [void, Account]
  'account-with-contracts': [void, AccountWithContracts]
}

export type ApiParse = {
  [K in keyof ApiIO]: (x: any) => ApiIO[K][1]
}

export type Api = {
  [K in keyof ApiIO]: AsRequest<ApiIO[K][0], ApiIO[K][1]>
}

export const toContracts = (contractsRaw: any) =>
  Object.keys(contractsRaw)
    .reduce((acc, k) => {
      acc[k] = as.Address(new Buffer(contractsRaw[k].substring(2), 'hex'))
      return acc
    }, {}) as Contracts

export const toAccount = (acc: { privateKey: string }): Account => {
  const privateKeyStr = util.stripHexPrefix(acc.privateKey)
  const privateKey = as.PrivateKey(new Buffer(privateKeyStr, 'hex'))
  const addressStr = util.privateToAddress(privateKey).toString('hex')
  return {
    addressStr,
    privateKeyStr,
    address: as.Address(new Buffer(addressStr, 'hex')),
    privateKey
  }
}

const request = (path: string, parseFn = x => x) => (serverUrl: string, params?: any) =>
  fetch(`${serverUrl}/${path}`)
    .then(r => r.status === 200 ? r.json() : Promise.reject(r))
    .then(parseFn)

const parse: ApiParse = {
  config: x => x,
  account: toAccount,
  'account-with-contracts': x => Object.assign(toAccount(x), { contracts: toContracts(x.contracts) })
}

export const api: Api =
  Object.keys(parse).reduce((acc, k) => {
    acc[k] = request(k, parse[k])
    return acc
  }, {} as Api)
