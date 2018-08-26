import * as WebSocket from 'ws'
import { execIfScript } from 'go-network-framework/build-dev'

import * as P from '../protocol'

import { hostname, port } from './config'

const send = (msg: P.ServerMessage) => (ws: WebSocket): boolean => {
  const data = JSON.stringify(msg)
  return ws.readyState === WebSocket.OPEN && (ws.send(data) || true)
}

const serve = () => {
  let active: P.Session[] = []
  let inCreation: Array<Partial<P.Session>> = []
  let wsToSessions = new Map<WebSocket, P.Session>()

  const wss = new WebSocket.Server({
    host: hostname,
    port: port
  })

  const updateGeneral = (clients?: WebSocket[]) => {
    const state: P.GeneralInfo = {
      connected: wss.clients.size,
      active: active,
      inCreation: inCreation
    }
    const _send = send({ type: 'general', payload: state });
    (clients || wss.clients as any as WebSocket[])
      .forEach(ws => !wsToSessions.has(ws) && _send(ws))

    console.log('UPDATE conn: ', state.connected, ' act: ', state.active.length, ' cre: ', state.inCreation.length)
  }

  const leaveSession = (ws: WebSocket, s = wsToSessions.get(ws)) => () => {
    if (s) {
      wsToSessions.delete(ws)
    }
    updateGeneral([ws])
  }

  wss.on('connection', ws => {
    updateGeneral()

    ws.on('close', () => updateGeneral())

    ws.on('message', (data) => console.log('MSG', data))
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
