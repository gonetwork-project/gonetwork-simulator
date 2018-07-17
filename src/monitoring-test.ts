import * as Rx from 'rxjs'

import { Monitoring } from 'go-network-framework'

const cfg = {
  NETWORK: 'ropsten',
  INFURA_TOKEN: 'AH1odSgjtotwGzf9xk23',
  CHANNEL_MANAGER_ADDRESS: '0xde8a6a2445c793db9af9ab6e6eaacf880859df01',
  TOKEN_ADDRESSES: [
    '0xa28a7a43bc389064ab5d16c0338968482b4e02bd', // go-token
    '0xbed8d09854a7013af00bdae0f0969f7285c2f4d2' // test-token
  ]
}

// FIXME - requires RPC, but most likely the file will be removed
const monitoring = new Monitoring({
  rpc: {} as any,
  logsInterval: 200,
  channelManagerAddress: cfg.CHANNEL_MANAGER_ADDRESS,
  tokenAddresses: cfg.TOKEN_ADDRESSES,

  storage: { // no persistent storage for now
    getItem: (id) => Promise.resolve(null),
    setItem: (id, item) => Promise.resolve(true),
    getAllKeys: () => Promise.resolve([]),

    multiGet: (keys) => Promise.resolve([]),
    multiSet: (xs) => Promise.resolve(true)
  }
} as any)

Rx.Observable.fromEvent(monitoring, 'ChannelNew')
  .take(10)
  .map((ev: any) => ev.netting_channel.toString('hex'))
  .map(add => `0x${add}`)
  .concatMap(add =>
    Rx.Observable.timer(2500)
      .mapTo(add)
      .do(monitoring.subscribeAddress as any)
  )
  .subscribe()
