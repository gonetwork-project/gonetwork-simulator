import * as React from 'react'
import { WebView, Dimensions } from 'react-native'

const html = require('../../vis/vis.html')

export class WebVis extends React.Component {
  wv!: WebView

  onLoad = () => {
    console.log('LOADED')
    this.wv.injectJavaScript(`window._GN.emitInit(0)`)
    let i = 0
    setInterval(() => {
      const e = `window._GN.emitEvent(${JSON.stringify({ event: i++ })})`
      // console.log('EVENT', e)
      this.wv.injectJavaScript(e)
    }, 2000)
  }

  render () {
    console.log('WITH-WEBKIT')
    const { width, height } = Dimensions.get('screen')
    const source = html
    // const source = { uri: 'http://192.168.1.10:8080/vis/vis.html' }
    return <WebView
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onLoadEnd={this.onLoad}
      onError={err => console.log('ERR', err)}
      ref={(r) => (this as any).wv = r} style={{ width, height }}
      source={source}
      // @ts-ignore
      useWebKit={true}
    >
    </WebView>
  }
}
