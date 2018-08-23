/// <reference path="../../node_modules/go-network-framework/build-dev/external-types.d.ts" />
/// <reference path="../../node_modules/go-network-framework/build-dev/index.d.ts" />

import { ganache, mqtt, execIfScript } from 'go-network-framework/build-dev'

import { configFromArgv } from './config'
import { serve as coordinator } from './coordinator'

const serve = () => {
  const c = configFromArgv()
  console.log(c)
  const toDispose = [mqtt(c), ganache(c), coordinator(c)]
  return () => toDispose.forEach(d => d())
}
execIfScript(serve, !module.parent)
