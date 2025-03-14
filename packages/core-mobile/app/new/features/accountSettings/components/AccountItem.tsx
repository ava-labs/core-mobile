import React from 'react'
import { Account } from 'store/account'
import {
  View,
  Text,
  Icons,
  TouchableOpacity,
  AnimatedPressable,
  useTheme,
  alpha
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectTokenVisibility } from 'store/portfolio'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance'
import { getItemEnteringAnimation } from 'common/utils/animations'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { ACCOUNT_CARD_SIZE } from './AcccountList'

export const AccountItem = ({
  index,
  isActive,
  account,
  onSelectAccount,
  gotoAccountDetails
}: {
  index: number
  isActive: boolean
  account: Account
  onSelectAccount: (accountIndex: number) => void
  gotoAccountDetails: (accountIndex: number) => void
}): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const tokenVisibility = useSelector(selectTokenVisibility)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(account.index, tokenVisibility)
  )

  const containerBackgroundColor = isActive
    ? colors.$textPrimary
    : colors.$surfaceSecondary

  const accountNameColor = isActive
    ? colors.$surfacePrimary
    : colors.$textPrimary

  const subtitleColor = isActive
    ? isDark
      ? alpha('#28282E', 0.6)
      : alpha('#FFFFFF', 0.6)
    : isDark // inactive
    ? alpha('#FFFFFF', 0.6)
    : alpha('#28282E', 0.6)

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
          <Text sx={{ color: accountNameColor }}>{account.name}</Text>
          <Text sx={{ color: subtitleColor }}>{accountBalance.toFixed(2)}</Text>
        </View>
        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            variant="subtitle2"
            sx={{ color: subtitleColor, lineHeight: 16, marginRight: 8 }}>
            {truncateAddress(account.addressC)}
          </Text>
          <TouchableOpacity onPress={() => gotoAccountDetails(account.index)}>
            <Icons.Alert.AlertCircle color={iconColor} />
          </TouchableOpacity>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}
