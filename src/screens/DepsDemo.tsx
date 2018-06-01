import * as React from 'react'
import { View, Text, Button } from 'react-native'
import * as keychain from 'react-native-keychain'

import PrivKeyQRScanner from '../components/KeyQRScanner'

export interface State {
  isKeychainOK?: boolean
  isQRScanOK?: boolean

  showScanner?: boolean
}

export default class PrivateKeysDemo extends React.Component<{}, State> {
  state: State = {}

  testKeychain = () => {
    const password = 'test-password'
    const service = 'test-service'

    keychain.setGenericPassword('', password, { service })
      .then(() => console.log('keychain: SET-OK'))
      .then(() => keychain.getGenericPassword({ service }))
      .then(r => {
        console.log('keychain', r)
        if (!(r && (r as any).password === password)) {
          return Promise.reject('keychain: READ-FAILED')
        }
        return Promise.resolve(true)
      })
      .then(() => console.log('keychain: READ-OK'))
      .then(() => this.setState({ isKeychainOK: true }))
      .catch(() => this.setState({ isKeychainOK: false }))
  }

  renderStatus = (what: string, isOK: boolean) =>
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>
        {`${what}: `}
        <Text style={{ color: isOK ? 'green' : 'red' }}>
          {isOK ? 'OK' : 'BROKEN'}
        </Text>
      </Text>
    </View>

  render () {
    return <View>
      {this.state.showScanner && <PrivKeyQRScanner onDone={(s, k) => {
        if (s === 'success') {
          console.log('QR-KEY', k)
          this.setState({ showScanner: false, isQRScanOK: true })
        } else {
          this.setState({ showScanner: false })
        }
      }} />}
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Private Keys Demo
      </Text>
      {
        this.state.isKeychainOK === undefined ?
          <Button title='Test Keychain' onPress={this.testKeychain} /> :
          this.renderStatus('Keychain', this.state.isKeychainOK)
      }
      {
        this.state.isQRScanOK === undefined ?
          <Button title='Test QR Scan' onPress={() => this.setState({ showScanner: true })} /> :
          this.renderStatus('QR Scan', this.state.isQRScanOK)
      }
      <View style={{ height: 128 }} />
      <Button title='reset' onPress={() => this.setState({ isKeychainOK: undefined, isQRScanOK: undefined })} />
    </View>
  }
}
