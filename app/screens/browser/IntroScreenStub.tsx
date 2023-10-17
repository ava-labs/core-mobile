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
import LinearGradientSVG from 'components/svg/LinearGradientSVG'

// const WINDOW_WIDTH = Dimensions.get('window').width
// const WINDOW_HEIGHT = Dimensions.get('window').height

const FROM_COLOR = 'rgba(0, 0, 0, 1)'
const TOO_COLOR = 'rgba(0, 122, 255, 1)'

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
      <View style={{ borderRadius: 8, overflow: 'hidden', borderWidth: 5 }}>
        <View
          style={{
            paddingTop: 92,
            paddingBottom: 80,
            paddingHorizontal: 16,
            alignItems: 'center',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
          <LinearGradientSVG
            colorFrom={TOO_COLOR}
            colorTo={FROM_COLOR}
            orientation="vertical"
            opacityFrom={0.8}
            opacityTo={0.8}
            loop={false}
            borderRadius={8}
            overflow="hidden"
          />
          <View
            style={{
              paddingTop: 216,
              position: 'absolute',
              flexDirection: 'row'
            }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <AvaText.Heading3
                textStyle={{
                  fontSize: 34,
                  paddingVertical: 0,
                  lineHeight: 44,
                  fontWeight: '700',
                  paddingLeft: 32,
                  paddingRight: 61,
                  paddingBottom: 24
                }}>
                How to use the Core browser...
              </AvaText.Heading3>
              <View
                style={{
                  paddingLeft: 32,
                  paddingTop: 16,
                  flexDirection: 'row'
                }}>
                <SearchSVG color={context.theme.neutral50} hideBorder />
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
              <View
                style={{
                  paddingLeft: 32,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                <OwlSVG width={23} height={18} />
                <Space x={16} />
                <AvaText.Heading6
                  textStyle={{
                    width: 259,
                    lineHeight: 24
                  }}>
                  Find Core and tap "Connect"
                </AvaText.Heading6>
              </View>
              <View
                style={{
                  paddingLeft: 32,
                  flexDirection: 'row',
                  paddingTop: 16,
                  alignItems: 'center'
                }}>
                <RocketSVG width={23} height={18} />
                <Space x={16} />
                <AvaText.Heading6 textStyle={{ width: 259, lineHeight: 24 }}>
                  Conquer the cryptoverse!
                </AvaText.Heading6>
              </View>
              <View
                style={{
                  height: 20,
                  paddingTop: 32,
                  paddingHorizontal: 16,
                  flexGrow: 1
                }}>
                <AvaButton.PrimaryLarge onPress={onInstructionRead}>
                  Get started!
                </AvaButton.PrimaryLarge>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  } else {
    return <BrowserScreenStack />
  }
}
