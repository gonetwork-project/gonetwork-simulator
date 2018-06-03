import * as React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { PrimaryTextColor, SecondaryTextColor } from '../theme'

export default function AccountLockedBar () {
  return (
    <View style={ styles.background }>
      <View style={ styles.bar }>
        <MDIcon name='lock' color={ SecondaryTextColor } size={ 16 } />
        <Text style={ styles.lockedText }>Account Locked</Text>
        <View style={ { flex: 1 } } />
        <Text style={ styles.unlockText }>UNLOCK</Text>
        <View style={ { backgroundColor: '#000', borderRadius: 18 } }>
          <IonIcon name='ios-finger-print' color='#fff' size={ 20 } style={ styles.unlockIcon } />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 10,
    paddingRight: 15
  },
  bar: {
    backgroundColor: '#fff',
    padding: 2,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  lockedText: {
    fontSize: 14,
    color: SecondaryTextColor,
    fontWeight: 'bold',
    marginLeft: 2
  },
  unlockText: {
    fontSize: 14,
    color: PrimaryTextColor,
    fontWeight: 'bold',
    marginRight: 2
  },
  unlockIcon: {
    lineHeight: 20,
    marginBottom: -3,
    paddingLeft: 2,
    paddingRight: 1
  }
})
