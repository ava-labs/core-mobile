import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  AnimatedPressable,
  Icons,
  Pressable,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getItemEnteringAnimation } from 'common/utils/animations'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import React, { memo, useCallback, useMemo } from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { Account } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { formatLargeCurrency } from 'utils/Utils'
import { ACCOUNT_CARD_SIZE } from './AcccountList'

export const AccountItem = memo(
  ({
    index,
    isActive,
    account,
    onSelectAccount,
    gotoAccountDetails,
    testID
  }: {
    index: number
    isActive: boolean
    account: Account
    onSelectAccount: (account: Account) => void
    gotoAccountDetails: (accountId: string) => void
    testID?: string
  }): React.JSX.Element => {
    const {
      balance: accountBalance,
      fetchBalance,
      isFetchingBalance,
      isBalanceLoaded
    } = useBalanceForAccount(account.id)
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors, isDark }
    } = useTheme()
    const { formatTokenInCurrency } = useFormatCurrency()

    const balance = useMemo(() => {
      // CP-10570: Balances should never show $0.00
      return accountBalance === 0
        ? ''
        : `${formatLargeCurrency(
            formatTokenInCurrency({ amount: accountBalance })
          )}`
    }, [accountBalance, formatTokenInCurrency])

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
      if (isFetchingBalance) {
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

      if (!isBalanceLoaded) {
        return (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: -4
            }}>
            <Pressable
              onPress={fetchBalance}
              onTouchStart={e => {
                // prevent the parent (the square pressable)from being pressed
                e.stopPropagation()
              }}>
              <Icons.Custom.BalanceRefresh color={colors.$textPrimary} />
            </Pressable>
          </View>
        )
      }
      return (
        <AnimatedBalance
          variant="heading6"
          balance={balance}
          shouldMask={isPrivacyModeEnabled}
          renderMaskView={renderMaskView}
          balanceSx={{ color: alpha(accountNameColor, 0.6), lineHeight: 18 }}
          shouldAnimate={false}
        />
      )
    }, [
      renderMaskView,
      accountNameColor,
      balance,
      fetchBalance,
      isBalanceLoaded,
      isPrivacyModeEnabled,
      colors.$textPrimary,
      isFetchingBalance
    ])

    return (
      <Animated.View
        entering={getItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}>
        <AnimatedPressable
          onPress={() => onSelectAccount(account)}
          style={{
            backgroundColor: containerBackgroundColor,
            width: ACCOUNT_CARD_SIZE,
            height: ACCOUNT_CARD_SIZE,
            borderRadius: 18,
            padding: 16,
            justifyContent: 'space-between'
          }}>
          <View>
            <Text
              variant="heading6"
              testID={`account_carousel_item__${account.name}`}
              numberOfLines={2}
              sx={{ color: accountNameColor, marginBottom: 2 }}>
              {account.name}
            </Text>
            {renderBalance()}
          </View>
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              variant="subtitle2"
              sx={{ color: subtitleColor, lineHeight: 16, marginRight: 8 }}>
              {truncateAddress(account.addressC)}
            </Text>
            <View onTouchStart={e => e.stopPropagation()}>
              <TouchableOpacity
                onPress={() => gotoAccountDetails(account.id)}
                hitSlop={16}>
                <Icons.Alert.AlertCircle
                  color={iconColor}
                  testID={`account_detail_icon__${testID}`}
                />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedPressable>
      </Animated.View>
    )
  }
)
