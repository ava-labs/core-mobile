import React, { memo, useMemo, useCallback, useState, useEffect } from 'react'
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
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility } from 'store/portfolio'
import {
  fetchBalanceForAccount,
  QueryStatus,
  selectBalanceStatus,
  selectBalanceTotalInCurrencyForAccount,
  selectIsBalanceLoadedForAccount
} from 'store/balance'
import { getItemEnteringAnimation } from 'common/utils/animations'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
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
    // eslint-disable-next-line sonarjs/cognitive-complexity
  }): React.JSX.Element => {
    const dispatch = useDispatch()
    const balanceStatus = useSelector(selectBalanceStatus)
    const isBalanceLoading = balanceStatus !== QueryStatus.IDLE
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors, isDark }
    } = useTheme()
    const [showLoader, setShowLoader] = useState(false)

    const tokenVisibility = useSelector(selectTokenVisibility)
    const accountBalance = useSelector(
      selectBalanceTotalInCurrencyForAccount(account.index, tokenVisibility)
    )
    const { formatCurrency } = useFormatCurrency()

    const isBalanceLoaded = useSelector(
      selectIsBalanceLoadedForAccount(account.index)
    )

    const handleLoadBalance = useCallback(() => {
      dispatch(fetchBalanceForAccount({ accountIndex: account.index }))
      setShowLoader(true)
    }, [dispatch, account.index])

    useEffect(() => {
      if (!isBalanceLoading && showLoader) {
        setShowLoader(false)
      }
    }, [setShowLoader, isBalanceLoading, showLoader])

    const balance = useMemo(() => {
      return formatCurrency({ amount: accountBalance })
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

    const backgroundColor = isActive
      ? isDark
        ? alpha('#28282E', 0.1)
        : alpha('#FFFFFF', 0.1)
      : isDark // inactive
      ? alpha('#FFFFFF', 0.1)
      : alpha('#28282E', 0.1)

    const iconColor = isActive ? colors.$surfacePrimary : colors.$textPrimary

    const renderBalance = useCallback(() => {
      if (isBalanceLoaded === false) {
        return (
          <Pressable
            onPress={handleLoadBalance}
            onTouchStart={e => {
              e.stopPropagation()
            }}>
            <Text
              variant="caption"
              numberOfLines={1}
              sx={{
                color: accountNameColor,
                fontFamily: 'Inter-SemiBold'
              }}>
              View Balance
            </Text>
          </Pressable>
        )
      }
      return (
        <AnimatedBalance
          variant="body1"
          balance={balance}
          shouldMask={isPrivacyModeEnabled}
          balanceSx={{ color: accountNameColor, lineHeight: 18 }}
          maskBackgroundColor={backgroundColor}
          shouldAnimate={false}
        />
      )
    }, [
      accountNameColor,
      backgroundColor,
      balance,
      handleLoadBalance,
      isBalanceLoaded,
      isPrivacyModeEnabled
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
              testID={`account_name__${testID}`}
              sx={{ color: accountNameColor }}>
              {account.name}
            </Text>
            {showLoader === false && renderBalance()}
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
        {showLoader && (
          <ActivityIndicator
            style={{
              marginRight: 14,
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }}
            size="small"
          />
        )}
      </Animated.View>
    )
  }
)
