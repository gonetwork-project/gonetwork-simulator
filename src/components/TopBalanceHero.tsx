import * as React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import {
  BalanceHeroCryptoColor, BalanceHeroCryptoValueColor, BalanceHeroUsdIconColor,
  BalanceHeroUsdValueColor
} from '../theme'

export interface Props {
  cryptoCurrency: string,
  usdValue: number,
  cryptoValue: number
}

export default (props: Props) => (
  <View style={ styles.root }>
    <Text style={ styles.crypto }>{ props.cryptoCurrency }</Text>
    <View style={ styles.usdValueWrapper }>
      <Text style={ styles.usdIcon }>$</Text>
      <Text style={ styles.usdValue }>{ props.usdValue.toFixed(2) }</Text>
    </View>
    <Text style={ styles.cryptoValue }>{ `${props.cryptoValue} ${props.cryptoCurrency}` }</Text>
  </View>
)

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center'
  },
  crypto: {
    color: BalanceHeroCryptoColor,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
  },
  usdValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center'
  },
  usdIcon: {
    fontSize: 19,
    color: BalanceHeroUsdIconColor,
    paddingRight: 2
  },
  usdValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: BalanceHeroUsdValueColor
  },
  cryptoValue: {
    fontSize: 16,
    color: BalanceHeroCryptoValueColor,
    textAlign: 'center'
  }
})
