import { bigintToBig } from '@avalabs/core-utils-sdk'
import { Text } from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import React from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import type { LocalTokenWithBalance } from 'store/balance'

type Props = {
  fee: bigint
  fromToken: LocalTokenWithBalance
}

export const AdditiveFeesNotice = ({
  fee,
  fromToken
}: Props): JSX.Element | null => {
  if (!('decimals' in fromToken) || fee === 0n) return null

  const formatted = bigintToBig(fee, fromToken.decimals).toFixed(6)
  const label =
    fromToken.type === TokenType.NATIVE
      ? 'for network and bridging fees'
      : 'for bridging fees'

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ alignItems: 'center', marginTop: 6 }}>
      <Text variant="caption" sx={{ alignSelf: 'center' }}>
        {`+${formatted} ${fromToken.symbol} ${label}`}
      </Text>
    </Animated.View>
  )
}
