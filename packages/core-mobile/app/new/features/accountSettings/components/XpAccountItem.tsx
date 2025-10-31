import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  AnimatedPressable,
  Icons,
  Pressable,
  Text,
  useTheme,
  usePreventParentPress,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getItemEnteringAnimation } from 'common/utils/animations'
import React, { memo, useCallback, useMemo } from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { Account } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useBalanceFoXpAccount } from 'common/contexts/useBalanceForXpAccunt'
import { XpNetworkVMType } from 'store/network/types'
import { ACCOUNT_CARD_SIZE } from './AcccountList'

export const XpAccountItem = memo(
  ({
    index,
    isActive,
    account,
    onSelectAccount
  }: {
    index: number
    isActive: boolean
    account: Account
    onSelectAccount: (account: Account) => void
    testID?: string
  }): React.JSX.Element => {
    const {
      balance: accountBalance,
      fetchBalance,
      isFetchingBalance,
      isBalanceLoaded
    } = useBalanceFoXpAccount(account.walletId, account.id as XpNetworkVMType)
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors }
    } = useTheme()
    const { formatCurrency } = useFormatCurrency()

    const { createParentPressHandler, createChildPressHandler } =
      usePreventParentPress()

    const handleSelectAccount = createParentPressHandler(() => {
      onSelectAccount(account)
    })

    const handleFetchBalance = createChildPressHandler(() => {
      fetchBalance()
    })

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
            <Pressable onPress={handleFetchBalance}>
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
        />
      )
    }, [
      isFetchingBalance,
      isBalanceLoaded,
      balance,
      isPrivacyModeEnabled,
      renderMaskView,
      accountNameColor,
      handleFetchBalance,
      colors.$textPrimary
    ])

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
        </AnimatedPressable>
      </Animated.View>
    )
  }
)
