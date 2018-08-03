import { Observable } from 'rxjs'

import * as c from './config'
import { passUndefined } from './utils'
import { invariant } from '../global'

// const initClient =

export const accounts = Observable.combineLatest(
  c.accounts,
  c.contractsAccount
)
  .do(invariant(([ac, cs]) => ac.length >= 1 && !!cs, 'Contract account and at least 1 more other accounts expected'))
  .switchMap(([ac, cs]) => {
    return Observable.of(null)
  })
  .do(x => console.log('ACC', x))
