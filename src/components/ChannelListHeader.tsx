import * as React from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { BlueLinkColor } from '../theme'

export interface Props {
  onNewChannel?: () => void
}

export default function ChannelListHeader (props: Props) {
  return (
    <View style={ styles.root }>
      <Text style={ styles.channels }>Channels</Text>

      <View style={ styles.line } />

      <TouchableOpacity onPress={ props.onNewChannel }>
        <Text style={ styles.button }>ADD CHANNEL</Text>
      </TouchableOpacity>
    </View>
  )
}

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
    height: 1,
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#eaeaed'
  },
  button: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BlueLinkColor
  }
})