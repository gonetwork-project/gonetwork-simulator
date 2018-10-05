import { message } from 'go-network-framework'
import { Address, BlockNumber, Wei } from 'eth-types'

import { Account } from './accounts'
import { timeouts } from './setup'

const { GenerateRandomSecretHashPair } = message

/*
  Caveat: 'true' does not mean that the transfer was received on the other end
  - only that it was submitted to be sent

  TODO: both methods should return at least promise but ideally more granular updates
 */

export const sendDirect = (from: Account, to: Address, amount: Wei) => {
  try {
    from.engine.sendDirectTransfer(to, amount)
  } catch (e) {
    return Promise.reject(e)
  }
  return Promise.resolve(true)
}

export const sendMediated = (from: Account, to: Address, amount: Wei) => {
  const secretHashPair = GenerateRandomSecretHashPair()
  return from.blockchain.monitoring.blockNumbers()
    .take(1)
    .map((currentBlock) => {
      // TODO: currently a global exception is thrown - we could try to use a RN.ErrorUtils to intercept it,
      // but way better would be to fix the underlying issue in the framework itself
      try {
        from.engine.sendMediatedTransfer(
          to,
          to,
          amount,
          currentBlock.add(from.engine.revealTimeout).add(timeouts.collateral) as BlockNumber,
          secretHashPair.secret as any, // FIXME
          secretHashPair.hash
        )
      } catch (e) {
        console.warn(e)
      }
    })
    .mapTo(true)
    .toPromise()
}
