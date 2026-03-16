import { BridgeType } from '@avalabs/bridge-unified'
import React from 'react'
import ICTTLogo from 'assets/icons/ictt_logo.svg'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import CircleLogo from '../../../assets/icons/circle_logo.svg'

const BridgeTypeFootnote = ({
  bridgeType
}: {
  bridgeType: BridgeType
}): JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()

  const renderCircleBadge = (): JSX.Element => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 4
        }}>
        <Text variant="caption">Powered by </Text>
        <CircleLogo
          width={75}
          height={20}
          style={{ marginTop: 1 }}
          color={colors.$textPrimary}
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
          gap: 4
        }}>
        <Text variant="caption">Powered by </Text>
        <ICTTLogo width={144} height={24} color={colors.$textPrimary} />
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
