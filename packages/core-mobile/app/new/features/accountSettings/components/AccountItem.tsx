import React, { memo, useMemo, useCallback } from 'react'
import { Account } from 'store/account'
import {
  View,
  Text,
  Icons,
  TouchableOpacity,
  AnimatedPressable,
  useTheme,
  alpha,
  AnimatedBalance,
  ActivityIndicator,
  Pressable
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { getItemEnteringAnimation } from 'common/utils/animations'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
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
    onSelectAccount: (accountIndex: number) => void
    gotoAccountDetails: (accountIndex: number) => void
    testID?: string
  }): React.JSX.Element => {
    const {
      balance: accountBalance,
      fetchBalance,
      isFetchingBalance,
      isBalanceLoaded
    } = useBalanceForAccount(account.index)
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors, isDark }
    } = useTheme()
    const { formatCurrency } = useFormatCurrency()

    const balance = useMemo(() => {
      // CP-10570: Balances should never show $0.00
      return accountBalance === 0
        ? ''
        : formatCurrency({ amount: accountBalance })
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
          onPress={() => onSelectAccount(account.index)}
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
                onPress={() => gotoAccountDetails(account.index)}
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
