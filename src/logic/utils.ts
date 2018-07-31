import { Observable } from 'rxjs'

export const ifDefined = <T, R>(s: (v: T) => Observable<R>) => (v: T | undefined) =>
  v ? s(v) : Observable.empty() as Observable<R>
