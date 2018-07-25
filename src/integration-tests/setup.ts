import {
  Engine, serviceCreate, setWaitForDefault, P2P, message, as, util,
  Millisecond, fakeStorage, CHAIN_ID, MonitoringConfig, BlockchainServiceConfig
} from 'go-network-framework'
import { Address, PrivateKey } from 'eth-types'

const sjcl = require('sjcl')
import { generateSecureRandom } from 'react-native-securerandom'

generateSecureRandom(1024).then(randomBytes => {
  let buf = new Uint32Array(randomBytes.buffer)
  sjcl.random.addEntropy(buf, 1024, 'crypto.randomBytes')
  let buffer = sjcl.random.randomWords(8, 10) // 256 bit random number
  // console.log('Random Number generated after seeding:' + sjcl.codec.hex.fromBits(buffer))
})

// todo: load via qr-code / pass via input
const coordinatorUrl = `http://192.168.1.71:5215`

export interface Account {
  privateKey: PrivateKey
  privateKeyStr: string
  address: Address
  addressStr: string
}

// todo: Expose in framework
export interface Contracts {
  gotToken: Address
  testToken: Address
  manager: Address
}

export const toContracts = (contractsRaw: any) =>
  Object.keys(contractsRaw)
    .reduce((acc, k) => {
      acc[k] = as.Address(new Buffer(contractsRaw[k].substring(2), 'hex'))
      return acc
    }, {}) as Contracts

export const toAccount = (privateKeyStr: string,
  addressStr: string = util.privateToAddress(new Buffer(privateKeyStr, 'hex')).toString('hex')): Account => ({
    addressStr,
    privateKeyStr,
    address: as.Address(new Buffer(addressStr, 'hex')),
    privateKey: as.PrivateKey(new Buffer(privateKeyStr, 'hex'))
  })

export const monitoringConfig: Partial<MonitoringConfig> = {
  logsInterval: 25,
  startBlock: 'latest'
}

export const setupClient = (contracts?: Contracts) =>
  fetch(`${coordinatorUrl}/config`).then(r => r.json())
    .then((cfg: any) => // todo: add proper typing - ideally define types in single place
      fetch(`${coordinatorUrl}/account${!contracts ? '-with-contracts' : ''}`)
        .then(r => r.json())
        .then((r: any) => {
          // TODO: not ideal mechanism - for test we increase block mining frequency
          setWaitForDefault({ timeout: 3000, interval: cfg.blockTime / 2 })
          const account = toAccount(r.privateKey.substring(2))
          contracts = contracts || toContracts(r.contracts)

          console.log(cfg, account, contracts)

          const p2p = new P2P({
            mqttUrl: cfg.urls.mqtt,
            address: account.addressStr,
            storage: fakeStorage()
          })

          const blockchain = serviceCreate({
            ...contracts,
            chainId: CHAIN_ID.GETH_PRIVATE_CHAINS,
            owner: account.address,
            signatureCb: (cb) => cb(account.privateKey),
            providerUrl: cfg.urls.eth,
            monitoringConfig: {
              startBlock: 'latest',
              logsInterval: 500 // cfg.blockTime
            }
          })

          const engine = new Engine({
            address: account.address,
            sign: (msg) => msg.sign(account.privateKey),
            send: (to, msg) => p2p.send(to.toString('hex'), message.serialize(msg)),
            blockchain: blockchain,
            settleTimeout: as.BlockNumber(6),
            revealTimeout: as.BlockNumber(3)
          })

          return { contracts, p2p, engine, blockchain, owner: account, txs: blockchain.txs }
        })
    )

export const expect = (cn: boolean | Function | any) => {
  if (typeof cn === 'function') {
    try {
      cn()
    } catch (e) {
      return { toThrow: () => null, toBe: (a: true) => null }
    }
    throw new Error('Should throw')
  }

  if (!cn) throw new Error('Excpected true')

  return { toBe: (a: true) => null, toThrow: () => null }
}

export type Client = ReturnType<typeof setupClient> extends Promise<infer U> ? U : never
