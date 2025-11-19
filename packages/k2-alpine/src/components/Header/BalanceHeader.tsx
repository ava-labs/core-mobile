import React, { useCallback } from 'react'
import { LayoutChangeEvent, Pressable } from 'react-native'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { AnimatedBalance } from '../AnimatedBalance/AnimatedBalance'
import { LoadingContent } from '../LoadingContent/LoadingContent'
import { PriceChangeIndicator } from '../PriceChangeIndicator/PriceChangeIndicator'
import { PriceChange } from '../PriceChangeIndicator/types'
import { Text, View } from '../Primitives'
import { BalanceLoader } from './BalanceHeaderLoader'
import { PrivacyModeAlert } from './PrivacyModeAlert'

export const BalanceHeader = ({
  accountName,
  walletName,
  formattedBalance,
  currency,
  errorMessage,
  priceChange,
  onLayout,
  isLoading,
  isLoadingBalances,
  isPrivacyModeEnabled = false,
  isDeveloperModeEnabled = false,
  renderMaskView,
  testID,
  onErrorPress
}: {
  accountName?: string
  walletName?: string
  formattedBalance: string
  currency: string
  errorMessage?: string
  priceChange?: PriceChange
  onLayout?: (event: LayoutChangeEvent) => void
  isLoading?: boolean
  isLoadingBalances?: boolean
  isPrivacyModeEnabled?: boolean
  isDeveloperModeEnabled?: boolean
  testID?: string
  onErrorPress?: () => void
  renderMaskView?: () => React.JSX.Element
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
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
      return <PrivacyModeAlert />
    }
    if (errorMessage) {
      return (
        <Pressable
          onPress={onErrorPress}
          style={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
          <Icons.Alert.Error
            width={16}
            height={16}
            color={colors.$textDanger}
          />
          <Text variant="buttonMedium" sx={{ color: colors.$textDanger }}>
            {errorMessage}
          </Text>
        </Pressable>
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
    colors.$textDanger,
    errorMessage,
    isDeveloperModeEnabled,
    isPrivacyModeEnabled,
    priceChange
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
        <LoadingContent isLoading={isLoadingBalances}>
          <AnimatedBalance
            balance={formattedBalance}
            currency={` ${currency}`}
            shouldMask={isPrivacyModeEnabled}
            renderMaskView={renderMaskView}
            balanceSx={{ lineHeight: 38 }}
            currencySx={{
              fontFamily: 'Aeonik-Medium',
              fontSize: 18,
              lineHeight: 28
            }}
          />
        </LoadingContent>

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
    isLoadingBalances,
    isPrivacyModeEnabled,
    renderMaskView,
    renderPriceChangeIndicator
  ])

  return (
    <View
      onLayout={onLayout}
      style={{
        gap: 4
      }}>
      {walletName && (
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icons.Custom.Wallet
            color={colors.$textSecondary}
            width={16}
            height={16}
          />
          <Text
            testID={`${testID}__balance_header_wallet_name`}
            variant="buttonMedium"
            sx={{
              lineHeight: 16,
              color: colors.$textSecondary
            }}
            numberOfLines={1}>
            {walletName}
          </Text>
        </View>
      )}
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {accountName && (
          <Text
            testID={`${testID}__balance_header_account_name`}
            variant="heading2"
            sx={{ color: '$textSecondary', lineHeight: 38 }}
            numberOfLines={1}>
            {accountName}
          </Text>
        )}
        <Icons.Navigation.ExpandAll color={colors.$textSecondary} />
      </View>
      {renderBalance()}
    </View>
  )
}
