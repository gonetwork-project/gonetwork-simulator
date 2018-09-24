import * as React from 'react'
import { WebView, Dimensions, Alert } from 'react-native'

// const js = require('../../../assets/web-vis-script.js')
const html = require('../../vis/vis.html.js')
// const script = require('../../vis/index.min.js')

const html2 = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Visualization</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    setTimeout(function () {
      document.body.insertAdjacentHTML('beforeend', '<div>script running</div>')
      window.GN.onEvent(e => document.body.insertAdjacentHTML('beforeend', '<div>' + JSON.stringify(e) + '</div>'))
  }, 1000)
  </script>
</head>

<body>
  <h1>EVENTS:</h1>
</body>

</html>
`
// console.log(script)
console.log(html)

export class WebVis extends React.Component {
  wv?: WebView

  onLoad = () => {
    console.log('LOADED')
    setTimeout(() => {
      console.log('INJECTING')
      // this.wv!.injectJavaScript(script)
    }, 2000)
    // setInterval(() => {
    //   // const ev = js.event(Date.now())
    //   this.wv!.injectJavaScript(js.event(Date.now()))
    // }, 1000)

  }

  render () {
    const { width, height } = Dimensions.get('screen')
    const source = { html, baseUrl: 'http://gonetwork.co' }
    // const source = { uri: 'http://192.168.1.10:8080/vis.gen.html' }
    // const source = { uri: 'https://archive.nytimes.com/www.nytimes.com/interactive/2012/11/11/sunday-review/counties-moving.html' }
    // const source = {
    //   // uri: 'https://bl.ocks.org/kerryrodden/raw/7090426/'
    //   uri: 'https://bl.ocks.org/mbostock/1386444'
    // }
    return <WebView
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onLoadEnd={this.onLoad}
      // injectedJavaScript={script}
      onError={err => console.log('ERR', err)}
      ref={(r) => (this as any).wv = r} style={{ width, height }}
      source={source}
    >
    </WebView>
  }
}
