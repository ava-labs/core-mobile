import {
  alpha,
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useBalanceInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceInCurrencyForAccount'
import React from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'
import { Account } from 'store/account'
import { Wallet } from 'store/wallet/types'
import { AccountBalance } from './AccountBalance'

export const AccountListItem = ({
  testID,
  account,
  wallet,
  isActive,
  isRefreshing,
  hideSeparator,
  onPress,
  onPressDetails
}: {
  testID: string
  account: Account
  wallet: Wallet
  isRefreshing: boolean
  isActive: boolean
  hideSeparator: boolean
  onPress: () => void
  onPressDetails: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const balance = useBalanceInCurrencyForAccount(account.id)

  return (
    <Animated.View layout={LinearTransition.easing(Easing.inOut(Easing.ease))}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          borderRadius: 12,
          height: 52,
          backgroundColor: isActive
            ? alpha(theme.colors.$textPrimary, 0.1)
            : 'transparent'
        }}>
        <View
          sx={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
          <View sx={{ height: 24, width: 24 }}>
            {isActive && (
              <Icons.Custom.CheckSmall
                color={theme.colors.$textPrimary}
                width={24}
                height={24}
              />
            )}
          </View>
          <View
            sx={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16
            }}>
            <View
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginVertical: 14
              }}>
              <Text
                testID={testID}
                variant="body1"
                numberOfLines={1}
                sx={{
                  color: theme.colors.$textPrimary,
                  fontSize: 15,
                  fontFamily: 'Inter-Medium',
                  lineHeight: 20
                }}>
                {account.name}
              </Text>
            </View>

            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                paddingRight: 14
              }}>
              <AccountBalance
                isActive={isActive}
                balance={balance.balance}
                errorMessage={balance.error ?? ''}
                isLoading={balance.isLoadingBalance}
                isRefreshing={isRefreshing}
                hasLoaded={balance.hasBalanceData}
                isAccurate={balance.dataAccurate}
                variant="skeleton"
              />
              <TouchableOpacity
                hitSlop={16}
                onPress={onPressDetails}
                testID={`account_detail_icon__${wallet.name}__${account.name}`}>
                <Icons.Alert.AlertCircle
                  color={theme.colors.$textPrimary}
                  width={18}
                  height={18}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {!hideSeparator && <Separator sx={{ marginLeft: 46 }} />}
    </Animated.View>
  )
}
