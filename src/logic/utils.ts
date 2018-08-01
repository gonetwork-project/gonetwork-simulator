import { Observable } from 'rxjs'

export const ignoreUndefined = <T, R> (s: (v: T) => Observable<R>) => (v: T | undefined) =>
  v ? s(v) : Observable.empty() as Observable<R>

export const passUndefined = <T, R> (s: (v: T) => Observable<R>) => (v: T | undefined) =>
  v ? s(v) : Observable.of(undefined) as Observable<R | undefined>
