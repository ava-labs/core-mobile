import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  AnimatedPressable,
  Icons,
  Text,
  usePreventParentPress,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getItemEnteringAnimation } from 'common/utils/animations'
import { useBalanceInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceInCurrencyForAccount'
import React, { memo, useCallback, useMemo } from 'react'
import { TouchableOpacity } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { Account } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectWalletById } from 'store/wallet/slice'
import { ACCOUNT_CARD_SIZE } from './AcccountList'

export const AccountItem = memo(
  ({
    index,
    isActive,
    account,
    onSelectAccount,
    gotoAccountDetails
  }: {
    index: number
    isActive: boolean
    account: Account
    onSelectAccount: (account: Account) => void
    gotoAccountDetails: (accountId: string) => void
    testID?: string
    // eslint-disable-next-line sonarjs/cognitive-complexity
  }): React.JSX.Element => {
    const wallet = useSelector(selectWalletById(account?.walletId ?? ''))
    const { balance: accountBalance, isLoadingBalance } =
      useBalanceInCurrencyForAccount(account.id)
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors, isDark }
    } = useTheme()
    const { formatCurrency } = useFormatCurrency()

    const { createParentPressHandler, createChildPressHandler } =
      usePreventParentPress()

    const handleSelectAccount = createParentPressHandler(() => {
      onSelectAccount(account)
    })

    const handleAccountDetails = createChildPressHandler(() =>
      gotoAccountDetails(account.id)
    )

    const balance = useMemo(() => {
      // CP-10570: Balances should never show $0.00
      return accountBalance === 0
        ? ''
        : `${formatCurrency({
            amount: accountBalance,
            notation: accountBalance < 100000 ? undefined : 'compact'
          })}`
    }, [accountBalance, formatCurrency])

    const containerBackgroundColor = isActive
      ? colors.$textPrimary
      : colors.$surfaceSecondary

    const accountNameColor = isActive
      ? colors.$surfacePrimary
      : colors.$textPrimary

    const subtitleColor = isActive
      ? isDark
        ? alpha('#28282E', 0.6)
        : '#83838D'
      : isDark // inactive
      ? alpha('#FFFFFF', 0.6)
      : alpha('#28282E', 0.6)

    const iconColor = isActive ? colors.$surfacePrimary : colors.$textPrimary

    const renderMaskView = useCallback(() => {
      return (
        <HiddenBalanceText
          variant={'heading6'}
          sx={{ color: alpha(accountNameColor, 0.6), lineHeight: 18 }}
        />
      )
    }, [accountNameColor])

    const renderBalance = useCallback(() => {
      if (isLoadingBalance) {
        return (
          <ActivityIndicator
            style={{
              alignSelf: 'flex-start',
              marginTop: 4
            }}
            size="small"
          />
        )
      }

      return (
        <AnimatedBalance
          variant="heading6"
          balance={balance}
          shouldMask={isPrivacyModeEnabled}
          renderMaskView={renderMaskView}
          balanceSx={{ color: alpha(accountNameColor, 0.6), lineHeight: 18 }}
        />
      )
    }, [
      isLoadingBalance,
      balance,
      isPrivacyModeEnabled,
      renderMaskView,
      accountNameColor
    ])

    const renderWalletIcon = useCallback(() => {
      if (
        wallet?.type === WalletType.LEDGER ||
        wallet?.type === WalletType.LEDGER_LIVE
      ) {
        return (
          <Icons.Custom.Ledger width={16} height={16} color={subtitleColor} />
        )
      }
      return (
        <Icons.Custom.Wallet width={16} height={16} color={subtitleColor} />
      )
    }, [wallet?.type, subtitleColor])

    return (
      <Animated.View
        entering={getItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}>
        <AnimatedPressable
          onPress={handleSelectAccount}
          style={{
            backgroundColor: containerBackgroundColor,
            width: ACCOUNT_CARD_SIZE,
            height: ACCOUNT_CARD_SIZE,
            borderRadius: 18,
            padding: 16,
            justifyContent: 'space-between'
          }}>
          <View sx={{ gap: 4 }}>
            <View>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingRight: 16
                }}>
                {renderWalletIcon()}
                <Text
                  variant="buttonMedium"
                  testID={`account_carousel_item__${wallet?.name}`}
                  numberOfLines={1}
                  sx={{ color: subtitleColor, lineHeight: 20 }}>
                  {wallet?.name}
                </Text>
              </View>
              <Text
                variant="heading6"
                testID={`account_carousel_item__${account.name}`}
                numberOfLines={2}
                sx={{ color: accountNameColor, lineHeight: 24 }}>
                {account.name}
              </Text>
            </View>

            {renderBalance()}
          </View>
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              variant="subtitle2"
              sx={{ color: subtitleColor, lineHeight: 16, marginRight: 8 }}>
              {truncateAddress(account.addressC)}
            </Text>
            <TouchableOpacity
              accessible={true}
              testID={`account_detail_icon__${account.name}`}
              accessibilityLabel={`account_detail_icon__${account.name}`}
              onPress={handleAccountDetails}
              hitSlop={16}>
              <Icons.Alert.AlertCircle color={iconColor} />
            </TouchableOpacity>
          </View>
        </AnimatedPressable>
      </Animated.View>
    )
  }
)
