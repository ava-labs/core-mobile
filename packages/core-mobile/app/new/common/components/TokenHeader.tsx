import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Text, View, Icons, BalanceLoader, useTheme } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { PrivacyModeAlert } from '@avalabs/k2-alpine'
import { useTokenNameForDisplay } from 'common/hooks/useTokenNameForDisplay'
import { LocalTokenWithBalance } from '../../../store/balance/types'
import { HiddenBalanceText } from './HiddenBalanceText'
import { SubTextNumber } from './SubTextNumber'

export const TokenHeader = ({
  token,
  formattedBalance,
  currency,
  errorMessage,
  onLayout,
  isLoading,
  isPrivacyModeEnabled = false
}: {
  token: LocalTokenWithBalance
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

  const tokenNameForDisplay = useTokenNameForDisplay({
    token,
    shouldShowAvaxTokenFullname: true
  })

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
              {token?.balanceDisplayValue ? (
                <View sx={{ flexDirection: 'row' }}>
                  <SubTextNumber
                    number={Number(
                      token.balanceDisplayValue.replaceAll(',', '')
                    )}
                    textColor={colors.$textPrimary}
                    textVariant="heading2"
                  />
                  <Text
                    variant="heading2"
                    sx={{
                      fontFamily: 'Aeonik-Medium',
                      color: colors.$textPrimary
                    }}>
                    {' ' + token.symbol}
                  </Text>
                </View>
              ) : (
                UNKNOWN_AMOUNT
              )}
            </Text>
          )}
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
        {tokenNameForDisplay}
      </Text>
      {renderBalance()}
    </View>
  )
}
