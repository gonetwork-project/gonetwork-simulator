type Exhaust<K extends string, V extends { [P in K]: any }> = V

export type SessionId = string
// export type UserName = string

export type ClientAction = 'create-session' | 'join-session' | 'leave-session' | 'create-account'

export type ClientRequests = Exhaust<ClientAction, {
  'create-session': SessionConfigClient
  'join-session': { sessionId: SessionId }
  // user needs to be in a session to perform these actions
  'leave-session': void
  'create-account': void
}>

export type ServerMessage = { type: 'general', payload: GeneralInfo } | { type: 'session', payload: UserSession }

export interface Session extends SessionConfig {
  id: SessionId
  created: number // milliseconds
  addresses: string[] // other addresses
  canCreateAccount: boolean
}

export interface UserSession extends Session {
  userAccounts: Account[]
}

export type GeneralInfo = {
  connected: number
  active: Session[]
  inCreation: Array<Partial<Session>>
}

export interface SessionConfigClient {
  blockTime: number
}

export interface SessionConfig extends SessionConfigClient {
  contracts: Contracts
  mqttUrl: string
  ethUrl: string
}

export interface Contracts {
  manager: string
  gotToken: string
  testToken: string
}

export interface Account {
  privateKey: string
  address: string
}
