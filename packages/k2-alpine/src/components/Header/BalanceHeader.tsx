import React, { useCallback } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { colors } from '../../theme/tokens/colors'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'
import { Text, View } from '../Primitives'
import { PriceChange } from '../PriceChangeIndicator/types'
import { AnimatedBalance } from '../AnimatedBalance/AnimatedBalance'
import { useTheme } from '../../hooks'
import { BalanceLoader } from './BalanceHeaderLoader'

export const BalanceHeader = ({
  accountName,
  formattedBalance,
  currency,
  errorMessage,
  priceChange,
  onLayout,
  isLoading,
  isPrivacyModeEnabled = false,
  isDeveloperModeEnabled = false
}: {
  accountName: string
  formattedBalance: string
  currency: string
  errorMessage?: string
  priceChange?: PriceChange
  onLayout?: (event: LayoutChangeEvent) => void
  isLoading?: boolean
  isPrivacyModeEnabled?: boolean
  isDeveloperModeEnabled?: boolean
}): React.JSX.Element => {
  const { theme } = useTheme()
  const renderPriceChangeIndicator = useCallback((): React.JSX.Element => {
    if (isDeveloperModeEnabled) {
      return (
        <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
          <Icons.Custom.WaterDropFilled width={16} height={16} />
          <Text
            variant="buttonMedium"
            sx={{
              color: '#27DAA6',
              fontSize: 14,
              lineHeight: 17
            }}>
            Testnet mode is on
          </Text>
        </View>
      )
    }
    if (isPrivacyModeEnabled) {
      return (
        <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
          <Icons.Action.VisibilityOff
            width={16}
            height={16}
            color={theme.colors.$textPrimary}
          />
          <Text
            variant="buttonMedium"
            sx={{
              color: theme.colors.$textPrimary,
              fontSize: 14,
              lineHeight: 17
            }}>
            Privacy mode is on
          </Text>
        </View>
      )
    }
    if (errorMessage) {
      return (
        <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
          <Icons.Alert.Error
            width={16}
            height={16}
            color={colors.$accentDanger}
          />
          <Text variant="buttonMedium" sx={{ color: colors.$accentDanger }}>
            {errorMessage}
          </Text>
        </View>
      )
    }

    if (priceChange === undefined) {
      return <></>
    }
    return (
      <PriceChangeIndicator
        formattedPrice={priceChange.formattedPrice}
        status={priceChange.status}
        formattedPercent={priceChange.formattedPercent}
        textVariant="buttonMedium"
        animated={true}
      />
    )
  }, [
    errorMessage,
    isDeveloperModeEnabled,
    isPrivacyModeEnabled,
    priceChange,
    theme.colors.$textPrimary
  ])

  const renderBalance = useCallback((): React.JSX.Element => {
    if (isLoading) {
      return <BalanceLoader />
    }

    return (
      <View
        style={{
          flexDirection: 'column',
          gap: 5
        }}>
        <AnimatedBalance
          balance={formattedBalance}
          currency={` ${currency}`}
          shouldMask={isPrivacyModeEnabled}
          maskWidth={200}
          balanceSx={{ lineHeight: 38 }}
          currencySx={{
            fontFamily: 'Aeonik-Medium',
            fontSize: 18,
            lineHeight: 28
          }}
        />

        <View
          style={{
            alignSelf: 'flex-start'
          }}>
          {renderPriceChangeIndicator()}
        </View>
      </View>
    )
  }, [
    currency,
    formattedBalance,
    isLoading,
    isPrivacyModeEnabled,
    renderPriceChangeIndicator
  ])

  return (
    <View onLayout={onLayout}>
      <Text
        testID="balance_header_account_name"
        variant="heading2"
        sx={{ color: '$textSecondary', lineHeight: 38 }}
        numberOfLines={1}>
        {accountName}
      </Text>
      {renderBalance()}
    </View>
  )
}
