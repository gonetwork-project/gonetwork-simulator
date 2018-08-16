import { Observable } from 'rxjs'

import { message, BN } from 'go-network-framework'
import { Address, BlockNumber, Wei } from 'eth-types'

import { Account } from '../logic/accounts'

const { GenerateRandomSecretHashPair } = message

export const sendDirect = (from: Account, to: Address, amount: Wei) => {
  try {
    from.engine.sendDirectTransfer(to, amount)
  } catch (e) {
    // console.log(e)
    throw e
  }

  return Observable.timer(400)
    .toPromise()

  // return Observable.fromEvent(from.p2p, 'message-received')
  //   .do(() => console.log('DONE'))
  //   .take(1) // DirectTransfer
  //   .delay(100) // allow processing by engine
  //   .toPromise()
}

export const sendMediated = (from: Account, to: Address, amount: Wei) => {
  // console.warn('MEDIATED', from.owner.addressStr, to.owner.addressStr, amount.toString())
  const secretHashPair = GenerateRandomSecretHashPair()
  return from.blockchain.monitoring.blockNumbers()
    .take(1)
    .do((currentBlock) => {
      from.engine.sendMediatedTransfer(
        to,
        to,
        amount,
        currentBlock.add(from.engine.revealTimeout).add(new BN(1)) as BlockNumber,
        secretHashPair.secret as any, // FIXME
        secretHashPair.hash
      )
    })
    .delayWhen(() =>
      Observable.fromEvent(from.p2p, 'message-received')
        .do(x => console.log('MEDIATED', x))
        .skip(1)
        .take(1)
        .delay(100) // allow processing by engine
    )
    .toPromise()
}
