import { Observable } from 'rxjs'
import * as c from './config'
import { passUndefined } from './utils'
import { invariant } from '../global'

export const accounts = Observable.combineLatest(
  c.accounts,
  c.contractsAccount
)
  .do(invariant(([ac, cs]) => ac.length >= 1 && !!cs, 'Contract account and at least 1 more other accounts expected'))
  .switchMap(passUndefined(c => Promise.resolve(c)))
  .do(x => console.log('ACC', x))
