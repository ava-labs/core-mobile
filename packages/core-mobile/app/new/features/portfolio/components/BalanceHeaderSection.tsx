import { BalanceHeader, PriceChange, View } from '@avalabs/k2-alpine'
import React, { memo } from 'react'
import { LayoutChangeEvent, Pressable, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

/**
 * Memoized balance header section to prevent full screen re-renders
 * when only balance-related props change
 */
export const BalanceHeaderSection = memo(
  ({
    onLayout,
    animatedHeaderStyle,
    onPress,
    walletName,
    walletIcon,
    accountName,
    formattedBalance,
    selectedCurrency,
    priceChange,
    errorMessage,
    onErrorPress,
    isLoading,
    isLoadingBalances,
    isPrivacyModeEnabled,
    isDeveloperMode,
    renderMaskView,
    backgroundColor
  }: {
    onLayout: (event: LayoutChangeEvent) => void
    animatedHeaderStyle: ViewStyle
    onPress: () => void
    walletName?: string
    walletIcon: 'wallet' | 'ledger'
    accountName?: string
    formattedBalance: string
    selectedCurrency: string
    priceChange?: PriceChange
    errorMessage?: string
    onErrorPress: () => void
    isLoading: boolean
    isLoadingBalances: boolean
    isPrivacyModeEnabled: boolean
    isDeveloperMode: boolean
    renderMaskView: () => JSX.Element
    backgroundColor: string
  }) => {
    return (
      <View onLayout={onLayout}>
        <Animated.View
          style={[
            {
              backgroundColor,
              marginTop: 16,
              paddingHorizontal: 16
            },
            animatedHeaderStyle
          ]}>
          <Pressable hitSlop={10} onPress={onPress}>
            <BalanceHeader
              testID="portfolio"
              walletName={walletName}
              walletIcon={walletIcon}
              accountName={accountName}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              priceChange={priceChange}
              errorMessage={errorMessage}
              onErrorPress={onErrorPress}
              isLoading={isLoading}
              isLoadingBalances={isLoadingBalances}
              isPrivacyModeEnabled={isPrivacyModeEnabled}
              isDeveloperModeEnabled={isDeveloperMode}
              renderMaskView={renderMaskView}
            />
          </Pressable>
        </Animated.View>
      </View>
    )
  }
)

BalanceHeaderSection.displayName = 'BalanceHeaderSection'
