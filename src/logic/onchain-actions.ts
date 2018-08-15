import { Wei, Address } from 'eth-types'
import { Account } from './accounts'

const log = <T> (msg: string, logValue = false, ...rest: any[]) => (p: T): Promise<T> => {
  logValue ? console.log(msg, p, ...rest) : console.log(msg, ...rest)
  return Promise.resolve(p)
}

export const openChannel = (account: Account, amount: Wei, other: Address) =>
  account.txs.approve({ to: account.contracts.gotToken },
    { _spender: account.contracts.manager, _value: amount })
    .then(log('APPROVED'))
    .then(() => {
      return account.txs.newChannel({ to: account.contracts.manager },
        { partner: other, settle_timeout: account.engine.settleTimeout })
    })
    .then(logs =>
      (logs.filter(x => x._type === 'ChannelNew')[0] as any).netting_channel)
    .then(log('CREATED'))

export const deposit = (account: Account, token: Address, channel: Address, amount: Wei) =>
  account.txs.approve({ to: token }, { _spender: channel, _value: amount })
    .then(() => account.txs.deposit({ to: channel }, { amount: amount }))

export const openChannelAndDeposit = (account: Account, amount: Wei, other: Address) =>
  Promise.all([
    account.blockchain.monitoring.asStream('ChannelNewBalance')
      .take(1)
      .delay(0)
      .toPromise(),
    // Promise.resolve(true),
    openChannel(account, amount, other)
      .then(ch => deposit(account, account.contracts.testToken, ch, amount)
        .then(() => ({ channel: ch }))
        .then(log(`CREATED AND DEPOSITED ${amount.toString()}$ chan: 0x${ch.toString('hex')} from: 0x${account.owner.addressStr} to: 0x${other.toString('hex')}`))
      )
  ])
    .then(([_, x]) => x)
