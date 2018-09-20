import * as React from 'react'
import { WebView, Dimensions, Alert } from 'react-native'

const js = require('../../../assets/web-vis-script.js')
// const html = require('../../../assets/vis.html').default

const html = `
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

console.log(js)

console.log(html)

const script = '(' + js.setup.toString() + ')()'
console.log(script)
// const script = 'document.body.innerHTML = "hy"'

export class WebVis extends React.Component {
  wv?: WebView

  onLoad = () => {
    // setTimeout(() => {
    console.log('INJECTED', script)
    // this.wv!.injectJavaScript(script)
    // }, 2000)
    setInterval(() => {
      // const ev = js.event(Date.now())
      this.wv!.injectJavaScript(js.event(Date.now()))
    }, 1000)

  }

  render () {
    const { width, height } = Dimensions.get('screen')
    return <WebView
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onLoadEnd={this.onLoad}
      injectedJavaScript={script}
      onError={err => console.log('ERR', err)}
      ref={(r) => (this as any).wv = r} style={{ width, height }} source={{ html }}>
    </WebView>
  }
}
