import { BridgeType } from '@avalabs/bridge-unified'
import React from 'react'
import { Linking } from 'react-native'
import CircleLogo from 'assets/icons/circle_logo.svg'
import ICTTLogo from 'assets/icons/ictt_logo.svg'
import { Tooltip } from 'components/Tooltip'
import { DOCS_BRIDGE_FAQS_URL } from 'resources/Constants'
import Logger from 'utils/Logger'
import { Text, useTheme, View } from '@avalabs/k2-mobile'

const BridgeTypeFootnote = ({
  bridgeType
}: {
  bridgeType: BridgeType
}): JSX.Element | undefined => {
  const { theme } = useTheme()

  const handleBridgeFaqs = (): void => {
    Linking.openURL(DOCS_BRIDGE_FAQS_URL).catch(e => {
      Logger.error(DOCS_BRIDGE_FAQS_URL, e)
    })
  }

  const renderCCTPPopoverInfoText = (): JSX.Element => (
    <View
      sx={{
        backgroundColor: '$neutral100',
        marginHorizontal: 8,
        marginVertical: 4
      }}>
      <Text
        variant="buttonSmall"
        sx={{ color: '$neutral900', fontWeight: '400' }}>
        USDC is routed through Circle's Cross-Chain Transfer Protocol.
      </Text>
      <Text
        variant="buttonSmall"
        onPress={handleBridgeFaqs}
        sx={{ color: '$blueDark' }}>
        Bridge FAQs
      </Text>
    </View>
  )

  const renderICTTPopoverInfoText = (): JSX.Element => (
    <View
      sx={{
        backgroundColor: '$neutral100',
        marginHorizontal: 8,
        marginVertical: 4
      }}>
      <Text
        variant="buttonSmall"
        sx={{ color: '$neutral900', fontWeight: '400' }}>
        Bridging this token pair utilizes Avalanche Interchain Messaging.
      </Text>
      <Text
        variant="buttonSmall"
        onPress={handleBridgeFaqs}
        sx={{ color: '$blueDark' }}>
        Bridge FAQs
      </Text>
    </View>
  )

  const renderCircleBadge = (): JSX.Element => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginBottom: 10
        }}>
        <Text variant="caption">Powered by </Text>
        <CircleLogo width={50} height={'100%'} style={{ marginTop: 1 }} />
        <Tooltip
          iconColor={theme.colors.$neutral50}
          content={renderCCTPPopoverInfoText()}
          position="top"
          style={{
            width: 200
          }}
        />
      </View>
    )
  }

  const renderICTTBadge = (): JSX.Element => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginBottom: 10
        }}>
        <Text variant="caption">Powered by </Text>
        <ICTTLogo style={{ marginTop: 1 }} />
        <Tooltip
          iconColor={theme.colors.$neutral50}
          content={renderICTTPopoverInfoText()}
          position="top"
          style={{
            width: 200
          }}
        />
      </View>
    )
  }

  return bridgeType === BridgeType.CCTP
    ? renderCircleBadge()
    : bridgeType === BridgeType.ICTT_ERC20_ERC20
    ? renderICTTBadge()
    : undefined
}

export default BridgeTypeFootnote
