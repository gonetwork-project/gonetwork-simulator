import * as React from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { TextButtonColor } from '../theme'

export interface Props {
  onNewChannel?: () => void
}

export default (props: Props) => (
  <View style={ styles.root }>
    <Text style={ styles.channels }>Channels</Text>

    <View style={ styles.line } />

    <TouchableOpacity onPress={ props.onNewChannel }>
      <Text style={ styles.button }>ADD CHANNEL</Text>
    </TouchableOpacity>
  </View>
)

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    paddingVertical: 25,
    alignItems: 'center'
  },
  channels: {
    fontSize: 25,
    fontWeight: 'bold'
  },
  line: {
    height: StyleSheet.hairlineWidth,
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#eaeaed'
  },
  button: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TextButtonColor
  }
})