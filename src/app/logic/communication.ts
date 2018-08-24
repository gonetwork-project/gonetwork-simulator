import * as pr from '../../protocol'

const ws = new WebSocket('ws://192.168.1.21:5215')

ws.onopen = () => console.log('OPENED')
