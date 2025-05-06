import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Text, View, Icons, BalanceLoader, useTheme } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { PrivacyModeAlert } from '@avalabs/k2-alpine'
import { LocalTokenWithBalance } from '../../../store/balance/types'
import { HiddenBalanceText } from './HiddenBalanceText'

export const TokenHeader = ({
  token,
  formattedBalance,
  currency,
  errorMessage,
  onLayout,
  isLoading,
  isPrivacyModeEnabled = false
}: {
  token?: LocalTokenWithBalance
  formattedBalance: string
  currency: string
  errorMessage?: string
  onLayout?: (event: LayoutChangeEvent) => void
  isLoading?: boolean
  isPrivacyModeEnabled?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const tokenName =
    token && isTokenWithBalanceAVM(token)
      ? 'Avalanche (X-Chain)'
      : token && isTokenWithBalancePVM(token)
      ? 'Avalanche (P-Chain)'
      : token?.name

  const renderBalance = (): React.JSX.Element => {
    if (isLoading) {
      return <BalanceLoader />
    }
    return (
      <View>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 4
          }}>
          {isPrivacyModeEnabled ? (
            <HiddenBalanceText isCurrency={false} sx={{ lineHeight: 38 }} />
          ) : (
            <Text
              variant="heading2"
              sx={{ lineHeight: 38, flexShrink: 1 }}
              numberOfLines={1}>
              {token?.balanceDisplayValue ?? UNKNOWN_AMOUNT}
            </Text>
          )}

          <Text
            sx={{ fontFamily: 'Aeonik-Medium', fontSize: 18, lineHeight: 28 }}>
            {token?.symbol}
          </Text>
        </View>
        <View sx={{ marginTop: 5 }}>
          {errorMessage ? (
            <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
              <Icons.Alert.Error
                width={16}
                height={16}
                color={colors.$textDanger}
              />
              <Text variant="buttonMedium" sx={{ color: colors.$textDanger }}>
                {errorMessage}
              </Text>
            </View>
          ) : isPrivacyModeEnabled ? (
            <PrivacyModeAlert />
          ) : (
            <Text variant="body2">
              {formattedBalance} {currency}
            </Text>
          )}
        </View>
      </View>
    )
  }
  return (
    <View onLayout={onLayout}>
      {token && (
        <LogoWithNetwork
          token={token}
          outerBorderColor={colors.$surfacePrimary}
        />
      )}
      <Text
        variant="heading2"
        sx={{ color: '$textSecondary', lineHeight: 38, marginTop: 10 }}
        numberOfLines={1}>
        {tokenName}
      </Text>
      {renderBalance()}
    </View>
  )
}
