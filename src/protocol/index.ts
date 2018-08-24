type Exhaust<K extends string, V extends { [P in K]: any }> = V
type WithStatus<V extends {}> = {
  [P in keyof V]: (V[P] & { status: 'success' }) | { status: 'error', reason?: string }
}
type WithSecret<V extends {}> = {
  [P in keyof V]: V & { secret?: string }
}

export type SessionId = string
export type User = string

export type Action = 'create-session' | 'join-session' | 'leave-session' | 'create-account'

export type Requests = WithSecret<Exhaust<Action, {
  'create-session': ConfigClient & { user: string }
  'join-session': { sessionId: SessionId, user: string }
  'leave-session': { sessionId: SessionId }
  'create-account': { sessionId: SessionId }
}>>

export type Responses = WithStatus<Exhaust<Action, {
  'create-session': boolean
  'join-session': boolean
  'leave-session': any
  'create-account': any
}>>

export interface ConfigClient {
  blockTime: number
}

export interface ConfigServer extends ConfigClient {
  contracts: Contracts
  mqttUrl: string
  ethUrl: string
}

export interface Config {
  urls: {
    mqtt: string
    eth: string
  }
  blockTime: number
}

export interface Contracts {
  manager: string
  gotToken: string
  testToken: string
}

export interface AccountBase {
  privateKey: string
  address: string
}
