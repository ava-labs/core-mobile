const base64 = require('base-64')
//React native doesn't implement this, but it is needed by RPC communication.
//This is taken from: https://github.com/facebook/react-native/issues/21209#issuecomment-495294672
FileReader.prototype.readAsArrayBuffer = function (blob) {
  if (this.readyState === this.LOADING) {
    throw new Error('InvalidStateError')
  }
  this._setReadyState(this.LOADING)
  this._result = null
  this._error = null
  const fr = new FileReader()
  fr.onloadend = () => {
    const index = fr.result.indexOf(';base64,')
    if (index === -1) {
      throw Error('Not base64 payload!')
    }
    const content = base64.decode(fr.result.substr(index + ';base64,'.length))
    const buffer = new ArrayBuffer(content.length)
    const view = new Uint8Array(buffer)
    view.set(Array.from(content).map(c => c.charCodeAt(0)))
    this._result = buffer
    this._setReadyState(this.DONE)
  }
  fr.readAsDataURL(blob)
}
