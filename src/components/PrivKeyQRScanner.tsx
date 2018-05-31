import * as React from 'react'
import { Modal, Button } from 'react-native'

import { RNCamera } from 'react-native-camera'

export type Status = 'cancel' | 'fail' | 'success'

export interface Props {
  onDone: (s: Status, k?: string) => void
}

export default class QRScan extends React.Component<Props> {

  render () {
    return <Modal animationType='slide'>
      <RNCamera
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onBarCodeRead={(ev) => this.props.onDone('success', ev.data)}
        style={{
          width: '100%',
          height: '100%'
        }} />
    </Modal>
  }
}
