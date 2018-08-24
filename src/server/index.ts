import * as WebSocket from 'ws'
import { hostname, port } from './config'

import { execIfScript } from 'go-network-framework/build-dev'

const serve = () => {
  const wss = new WebSocket.Server({
    host: hostname,
    port: port
  })

  wss.on('connection', ws => {
    console.log('connection')
  })

  wss.on('listening', () => {
    console.log(`Simulator Server listening on ws://${hostname}:${port}`)
  })

  wss.on('error', (error) => {
    console.error('CRITICAL ERROR')
    console.error(error)
    process.exit(1)
  })

  return () => {
    console.log('Closing Simulator Server')
    wss.close()
  }
}

execIfScript(serve, !module.parent)
