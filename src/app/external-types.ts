declare module '*.html'

// #region WEBSOCKET

// copied and adjusted from: https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts

interface EventListenerOptions {
  capture?: boolean
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean
  passive?: boolean
}

interface MessageEvent extends Event {
  /**
   * Returns the data of the message.
   */
  readonly data: any
  /**
   * Returns the last event ID string, for
   * server-sent events.
   */
  readonly lastEventId: string
  /**
   * Returns the origin of the message, for server-sent events and
   * cross-document messaging.
   */
  readonly origin: string
  /**
   * Returns the MessagePort array sent with the message, for cross-document
   * messaging and channel messaging.
   */
  readonly ports: ReadonlyArray<any>
  /**
   * Returns the WindowProxy of the source window, for cross-document
   * messaging, and the MessagePort being attached, in the connect event fired at
   * SharedWorkerGlobalScope objects.
   */
  readonly source: any | null
}

interface CloseEvent extends Event {
  readonly code: number
  readonly reason: string
  readonly wasClean: boolean
  /** @deprecated */
  initCloseEvent (typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, wasCleanArg: boolean, codeArg: number, reasonArg: string): void
}

interface WebSocketEventMap {
  'close': CloseEvent
  'error': Event
  'message': MessageEvent
  'open': Event
}

interface WebSocket extends EventTarget {
  readonly CLOSED: number
  readonly CLOSING: number
  readonly CONNECTING: number
  readonly OPEN: number
  binaryType: 'arraybuffer' | 'blob'
  readonly bufferedAmount: number
  readonly extensions: string
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null
  onerror: ((this: WebSocket, ev: Event) => any) | null
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null
  onopen: ((this: WebSocket, ev: Event) => any) | null
  readonly protocol: string
  readonly readyState: number
  readonly url: string
  close (code?: number, reason?: string): void
  send (data: string | ArrayBufferLike | ArrayBufferView): void
  addEventListener<K extends keyof WebSocketEventMap> (type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void
  // addEventListener (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  removeEventListener<K extends keyof WebSocketEventMap> (type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void
  // removeEventListener (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
}

declare var WebSocket: {
  readonly CLOSED: number
  readonly CLOSING: number
  readonly CONNECTING: number;
  readonly OPEN: number;
  prototype: WebSocket;
  new(url: string, protocols?: string | string[]): WebSocket;
}
// #endregion WEBSOCKET
