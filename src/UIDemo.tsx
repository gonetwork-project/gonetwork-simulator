import * as React from 'react'
import { View, SafeAreaView } from 'react-native'
import TopBalanceHero from './components/TopBalanceHero'
import AccountLockedBar from './components/AccountLockedBar'
import { ListBackgroundColor } from './theme'
import ChannelListItem from './components/ChannelListItem'
import ChannelListHeader from './components/ChannelListHeader'

export default class UIDemo extends React.Component {
  render () {
    return (
      <SafeAreaView>
        <View style={ { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, marginBottom: 30 } }>
          <TopBalanceHero cryptoCurrency='ETH' usdValue={ 853.24 } cryptoValue={ 1.12011042 } />
          <TopBalanceHero cryptoCurrency='GOT' usdValue={ 316.19 } cryptoValue={ 0.00121142 } />
        </View>

        <View>
          <AccountLockedBar />
        </View>

        <View style={ { padding: 15, paddingTop: 0, backgroundColor: ListBackgroundColor } }>
          <ChannelListHeader/>

          <View style={ { paddingBottom: 15 } }>
            <ChannelListItem state='open' channelAddress='0x10238012980af888df' peerName='Amit' balance={ 30 } />
          </View>

          <View style={ { paddingBottom: 15 } }>
            <ChannelListItem state='closed'
                             channelAddress='0x10238012980af888df'
                             peerName='Amit'
                             balance={ 30 }
                             time={ 89 } />
          </View>

          <View style={ { paddingBottom: 15 } }>
            <ChannelListItem state='settled' channelAddress='0x10238012980af888df' peerName='Amit' balance={ 30 } />
          </View>
        </View>
      </SafeAreaView>
    )
  }
}