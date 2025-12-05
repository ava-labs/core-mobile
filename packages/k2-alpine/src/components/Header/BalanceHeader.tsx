import React, { useCallback } from 'react'
import { LayoutChangeEvent, Pressable } from 'react-native'
import { SCREEN_WIDTH } from '../../const'
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
  walletIcon,
  formattedBalance,
  currency,
  errorMessage,
  priceChange,
  onLayout,
  isLoading,
  isLoadingBalances,
  isPrivacyModeEnabled = false,
  isDeveloperModeEnabled = false,
  hideExpand = false,
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
  walletIcon?: 'wallet' | 'ledger'
  onLayout?: (event: LayoutChangeEvent) => void
  isLoading?: boolean
  isLoadingBalances?: boolean
  isPrivacyModeEnabled?: boolean
  isDeveloperModeEnabled?: boolean
  testID?: string
  hideExpand?: boolean
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
    onErrorPress,
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

  const renderWalletIcon = useCallback((): JSX.Element => {
    if (walletIcon === 'ledger') {
      return (
        <Icons.Custom.Ledger
          color={colors.$textSecondary}
          width={16}
          height={16}
        />
      )
    }

    return (
      <Icons.Custom.Wallet
        color={colors.$textSecondary}
        width={16}
        height={16}
      />
    )
  }, [colors.$textSecondary, walletIcon])

  return (
    <View onLayout={onLayout}>
      <View sx={{ paddingRight: 16 }}>
        {walletName && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              width: SCREEN_WIDTH * 0.5
            }}>
            {renderWalletIcon()}
            <Text
              testID={`${testID}__balance_header_wallet_name`}
              variant="buttonMedium"
              sx={{
                lineHeight: 20,
                width: '100%',
                color: colors.$textSecondary
              }}
              numberOfLines={1}>
              {walletName}
            </Text>
          </View>
        )}
        {accountName && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              gap: 4
            }}>
            <Text
              testID={`${testID}__balance_header_account_name`}
              variant="heading2"
              sx={{ color: '$textSecondary', lineHeight: 42 }}
              numberOfLines={1}>
              {accountName}
            </Text>
            {!hideExpand && (
              <Icons.Navigation.ExpandAll color={colors.$textSecondary} />
            )}
          </View>
        )}
      </View>

      {renderBalance()}
    </View>
  )
}
