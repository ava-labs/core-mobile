import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import BrowserScreenStack from 'navigation/wallet/BrowserScreenStack'
import SearchSVG from 'components/svg/SearchSVG'
import { Space } from 'components/Space'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OwlSVG from 'components/svg/OwlSVG'
import RocketSVG from 'components/svg/RocketSVG'

// const WINDOW_WIDTH = Dimensions.get('window').width
// const WINDOW_HEIGHT = Dimensions.get('window').height

export default function IntroScreenStub({
  shouldShowInstruction,
  onInstructionRead
}: {
  shouldShowInstruction: boolean
  onInstructionRead: () => void
}): JSX.Element {
  const context = useApplicationContext()

  if (shouldShowInstruction) {
    return (
      <View>
        <View
          style={{
            paddingTop: 216,
            alignContent: 'flex-end',
            paddingLeft: 32,
            paddingRight: 45
          }}>
          <AvaText.Heading3
            textStyle={{
              fontSize: 34,
              paddingVertical: 24,
              lineHeight: 44,
              fontWeight: '700'
            }}>
            How to use the Core browser...
          </AvaText.Heading3>
        </View>
        <View style={{ flexDirection: 'row', paddingLeft: 32 }}>
          <SearchSVG size={24} color={context.theme.neutral50} />
          <Space x={16} />
          <AvaText.Heading6 textStyle={{ width: 259, lineHeight: 24 }}>
            Search for a website or browse suggested apps
          </AvaText.Heading6>
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingLeft: 32,
            paddingVertical: 16
          }}>
          <WalletConnectSVG size={24} color={context.theme.neutral50} />
          <Space x={16} />
          <AvaText.Heading6 textStyle={{ width: 259, lineHeight: 24 }}>
            Connect your wallet to interact with dapps
          </AvaText.Heading6>
        </View>
        <View style={{ paddingLeft: 32, flexDirection: 'row' }}>
          <OwlSVG width={23} height={18} />
          <Space x={16} />
          <AvaText.Heading6 textStyle={{ width: 259, lineHeight: 24 }}>
            Find Core and tap "Connect"
          </AvaText.Heading6>
        </View>
        <View style={{ paddingLeft: 32, flexDirection: 'row', paddingTop: 16 }}>
          <RocketSVG width={23} height={18} />
          <Space x={16} />
          <AvaText.Heading6 textStyle={{ width: 259, lineHeight: 24 }}>
            Conquer the cryptoverse!
          </AvaText.Heading6>
        </View>
        <View style={{ height: 20, paddingTop: 32, paddingHorizontal: 32 }}>
          <AvaButton.PrimaryLarge onPress={onInstructionRead}>
            Get started!
          </AvaButton.PrimaryLarge>
        </View>
      </View>
    )
  } else {
    return <BrowserScreenStack />
  }
}
