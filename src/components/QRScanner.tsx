import * as React from 'react'
import { Modal, Button } from 'react-native'
import { RNCamera, BarCodeType } from 'react-native-camera'

import * as util from 'ethereumjs-util'

export type ScanStatus = 'cancel' | 'fail' | 'mis-match' | 'success'

export interface Props {
  scanFor?: 'private' | 'public' // by-defualt it will look for both public and private keys
  onDone: (s: ScanStatus, k?: string) => void
}

export default class QRScan extends React.Component<Props> {
  // todo: cancel support and/or timeout
  onScan = (ev: { type: keyof BarCodeType, data: string }) => {
    const scanFor = this.props.scanFor ? [this.props.scanFor] : ['private', 'public']
    const maybeKey = util.toBuffer(ev.data)
    const valid = scanFor.map(k => {
      if (k === 'private') return util.isValidPrivate(maybeKey) && ev.data
      else if (k === 'public') return util.isValidPublic(maybeKey) && ev.data
    })
      .filter(Boolean)
    if (valid[0]) {
      this.props.onDone('success', ev.data)
    } else {
      this.props.onDone('fail')
    }
  }

  render () {
    return <Modal animationType='slide'>
      <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={this.onScan}
        style={{
          width: '100%',
          height: '100%'
        }} />
    </Modal>
  }
}
