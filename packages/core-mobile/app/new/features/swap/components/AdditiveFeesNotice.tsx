import { bigintToBig } from '@avalabs/core-utils-sdk'
import { Text, Tooltip, View } from '@avalabs/k2-alpine'
import React from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import type { LocalTokenWithBalance } from 'store/balance'

const TOOLTIP_TITLE = 'Bridge Fee'
const TOOLTIP_DESCRIPTION =
  'The final fee may vary based on network conditions at execution.'

type Props = {
  // Additive fee denominated in the source token (e.g. deBridge fee in USDC)
  fee: bigint
  fromToken: LocalTokenWithBalance
  // Additive fee denominated in the native asset (e.g. CCIP bridge fee in AVAX)
  nativeFee?: bigint
  nativeFromToken?: LocalTokenWithBalance
}

const FeeRow = ({
  amount,
  symbol
}: {
  amount: string
  symbol: string
}): JSX.Element => (
  <View
    sx={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      justifyContent: 'center'
    }}>
    <Text variant="caption">{`+ ~${amount} ${symbol} for bridge fees`}</Text>
    <Tooltip
      title={TOOLTIP_TITLE}
      description={TOOLTIP_DESCRIPTION}
      size={14}
    />
  </View>
)

export const AdditiveFeesNotice = ({
  fee,
  fromToken,
  nativeFee,
  nativeFromToken
}: Props): JSX.Element | null => {
  const hasSourceFee = 'decimals' in fromToken && fee > 0n
  const hasNativeFee =
    nativeFee !== undefined &&
    nativeFee > 0n &&
    nativeFromToken !== undefined &&
    'decimals' in nativeFromToken

  if (!hasSourceFee && !hasNativeFee) return null

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ alignItems: 'center', marginTop: 6, gap: 2 }}>
      {hasNativeFee && nativeFromToken && 'decimals' in nativeFromToken && (
        <FeeRow
          amount={bigintToBig(nativeFee, nativeFromToken.decimals).toFixed(6)}
          symbol={nativeFromToken.symbol}
        />
      )}
      {hasSourceFee && 'decimals' in fromToken && (
        <FeeRow
          amount={bigintToBig(fee, fromToken.decimals).toFixed(6)}
          symbol={fromToken.symbol}
        />
      )}
    </Animated.View>
  )
}
