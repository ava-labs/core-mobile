import React, { memo } from 'react'
import { Account } from 'store/account'
import {
  View,
  Text,
  Icons,
  TouchableOpacity,
  AnimatedPressable,
  useTheme,
  alpha,
  AnimatedBalance
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectTokenVisibility } from 'store/portfolio'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance'
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
  }): React.JSX.Element => {
    const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
    const {
      theme: { colors, isDark }
    } = useTheme()

    const tokenVisibility = useSelector(selectTokenVisibility)
    const accountBalance = useSelector(
      selectBalanceTotalInCurrencyForAccount(account.index, tokenVisibility)
    )
    const { formatCurrency } = useFormatCurrency()

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
            <AnimatedBalance
              variant="body1"
              balance={formatCurrency({ amount: accountBalance })}
              shouldMask={isPrivacyModeEnabled}
              balanceSx={{ color: subtitleColor, lineHeight: 18 }}
              maskBackgroundColor={backgroundColor}
            />
          </View>
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              variant="subtitle2"
              sx={{ color: subtitleColor, lineHeight: 16, marginRight: 8 }}>
              {truncateAddress(account.addressC)}
            </Text>
            <TouchableOpacity
              onPress={() => gotoAccountDetails(account.index)}
              hitSlop={16}>
              <Icons.Alert.AlertCircle color={iconColor} />
            </TouchableOpacity>
          </View>
        </AnimatedPressable>
      </Animated.View>
    )
  }
)
