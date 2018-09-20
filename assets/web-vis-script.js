// let alert

module.exports = {
  setup: function () {
    let _cb = function () { }
    window.GN = {
      emit: function (e) { _cb(JSON.parse(e)) },
      onEvent: function (cb) {
        document.body.insertAdjacentHTML('beforeend', '<div>callback-registered</div>')
        _cb = cb
      }
    }
    document.body.insertAdjacentHTML('beforeend', '<div>injected</div>')
  },
  event: function (e) {
    return `window.GN.emit('${JSON.stringify(e)}')`
  }
}
