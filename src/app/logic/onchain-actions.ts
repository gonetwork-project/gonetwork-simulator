import { Wei, Address } from 'eth-types'
import { Account } from './accounts'

const log = <T> (msg: string, logValue = false, ...rest: any[]) => (p: T): Promise<T> => {
  logValue ? console.log(msg, p, ...rest) : console.log(msg, ...rest)
  return Promise.resolve(p)
}

export type ActionStepStatus = 'not-started' | 'waiting' | 'ok' | 'error'

export type OpenAndDepositSteps = 'ApproveGot' | 'NewChannel' | 'ApproveChannel' | 'Deposit'

export type OpenAndDepositState = { [K in OpenAndDepositSteps]: { status: ActionStepStatus, message?: string } }

export const openAndDepositStateStart: () => OpenAndDepositState = () => ({
  ApproveGot: { status: 'not-started' },
  NewChannel: { status: 'not-started' },
  ApproveChannel: { status: 'not-started' },
  Deposit: { status: 'not-started' }
})

type LogFn = (k: OpenAndDepositSteps, s: ActionStepStatus, message?: string) => void

export const openChannel = (account: Account, amount: Wei, other: Address, log: LogFn) => {
  log('ApproveGot', 'waiting')
  return account.txs.approve({ to: account.contracts.gotToken },
    { _spender: account.contracts.manager, _value: amount })
    .then(() => {
      log('ApproveGot', 'ok')
      log('NewChannel', 'waiting')
      return account.txs.newChannel({ to: account.contracts.manager },
        { partner: other, settle_timeout: account.engine.settleTimeout })
    })
    .then(logs => {
      log('NewChannel', 'ok')
      return (logs.filter(x => x._type === 'ChannelNew')[0] as any).netting_channel
    })
}

export const deposit = (account: Account, token: Address, channel: Address, amount: Wei, log: LogFn) => {
  log('ApproveChannel', 'waiting')
  return account.txs.approve({ to: token }, { _spender: channel, _value: amount })
    .then(() => {
      log('ApproveChannel', 'ok')
      log('Deposit', 'waiting')
      account.txs.deposit({ to: channel }, { amount: amount })
        .then(d => {
          log('Deposit', 'ok')
          return d
        })
    })
}

export const openChannelAndDeposit = (account: Account, amount: Wei, other: Address, log: LogFn) =>
  Promise.all([
    account.blockchain.monitoring.asStream('ChannelNewBalance')
      .skip(1)
      .take(1)
      .delay(0)
      .toPromise(),
    openChannel(account, amount, other, log)
      .then(ch => deposit(account, account.contracts.testToken, ch, amount, log)
        .then(() => ({ channel: ch }))
      )
  ])
    .then(([_, x]) => x)

export const closeChannel = () => null
