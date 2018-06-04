import * as React from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import {
  ClosedColor,
  ListItemDividerColor,
  ListItemTextColor,
  OpenColor,
  SecondaryTextColor,
  SettledColor
} from '../theme'
import MDIcon from 'react-native-vector-icons/MaterialCommunityIcons'

type State = 'open' | 'closed' | 'settled'

export interface Props {
  state: State,
  channelAddress: string,
  peerName: string,
  balance: number,
  time?: number,
  onLockPress?: () => void,
  onArrowPress?: () => void
}

export default (props: Props) => (
  <View style={ styles.root }>
    <View style={ styles.leftBox }>
      <Text style={ [styles.state, { color: stateColor(props.state) }] }>
        { props.state.toUpperCase() }
      </Text>
      <Text style={ styles.address }>{ props.channelAddress }</Text>
      <Text style={ styles.peerName }>{ props.peerName }</Text>
    </View>

    <View style={ styles.balanceWrapper }>
      <View style={ styles.balance }>
        <Text style={ styles.balanceCurrency }>$</Text>
        <Text style={ styles.balanceWhole }>{ props.balance.toFixed(0) }</Text>
        <Text style={ styles.balanceDecimal }>{ props.balance.toFixed(2).substr(-3) }</Text>
      </View>
    </View>

    { props.state === 'open' &&
    <View style={ styles.rightBox }>
      <TouchableOpacity onPress={ props.onLockPress }
                        style={ [styles.rightButton, {
                          borderBottomColor: ListItemDividerColor,
                          borderBottomWidth: 1
                        }] }>
        <MDIcon name='lock-outline' color={ SecondaryTextColor } size={ 20 } />
      </TouchableOpacity>
      <TouchableOpacity onPress={ props.onArrowPress } style={ styles.rightButton }>
        <MDIcon name='arrow-right' color={ SecondaryTextColor } size={ 20 } />
      </TouchableOpacity>
    </View>
    }

    { props.state === 'closed' && props.time !== undefined &&
    <View style={ [styles.rightBox, styles.rightBoxCentered] }>
      <Text style={ styles.remainingTime }>{ secondsToTime(props.time) }</Text>
    </View>
    }
  </View>
)

function stateColor (state: State) {
  switch (state) {
    case 'open':
      return OpenColor
    case 'closed':
      return ClosedColor
    case 'settled':
      return SettledColor
  }
}

// TODO support for days, hours?
function secondsToTime (seconds: number) {
  const min = Math.floor(seconds / 60)
  const sec = ('' + (seconds % 60)).padStart(2)

  return `${min}:${sec}`
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: 'rgba(100, 100, 100, 0.1)',
    shadowRadius: 3,
    shadowOffset: {
      height: 0,
      width: 0
    },
    shadowOpacity: 1
  },
  leftBox: {
    padding: 12,
    flex: 1
  },
  state: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: 'bold',
    marginBottom: 10
  },
  address: {
    fontSize: 15,
    lineHeight: 15,
    color: ListItemTextColor,
    marginBottom: 5
  },
  peerName: {
    fontSize: 16,
    lineHeight: 16,
    color: SecondaryTextColor
  },
  balanceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  balanceCurrency: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: 'bold',
    color: ListItemTextColor,
    marginRight: 1
  },
  balanceWhole: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: 'bold',
    color: ListItemTextColor
  },
  balanceDecimal: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: 'bold',
    color: ListItemTextColor
  },
  rightBox: {
    width: 45,
    borderLeftWidth: 1,
    borderLeftColor: ListItemDividerColor
  },
  rightBoxCentered: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  remainingTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: SecondaryTextColor
  }
})
