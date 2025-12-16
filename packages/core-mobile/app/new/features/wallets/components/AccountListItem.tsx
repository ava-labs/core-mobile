import {
  alpha,
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useUserBalances } from 'features/portfolio/hooks/useUserBalances'
import React from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'
import { Account } from 'store/account'
import { Wallet } from 'store/wallet/types'
import { AccountBalance } from './AccountBalance'
import { useBalanceTotalInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForAccount'
import { useIsAccountBalanceAccurate } from 'features/portfolio/hooks/useIsAccountBalancesAccurate'

export const AccountListItem = ({
  testID,
  account,
  wallet,
  isActive,
  hideSeparator,
  onPress,
  onPressDetails
}: {
  testID: string
  account: Account
  wallet: Wallet
  isActive: boolean
  hideSeparator: boolean
  onPress: () => void
  onPressDetails: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  // const balance = useBalanceInCurrencyForAccount(account.id)
  const balance = useBalanceForAccount(account)

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
                balance={balance}
                variant="skeleton"
                // refetch={refetchBalances}
              />
              <TouchableOpacity hitSlop={16} onPress={onPressDetails}>
                <Icons.Alert.AlertCircle
                  testID={`account_detail_icon__${wallet.name}_${account.name}`}
                  color={theme.colors.$textPrimary}
                  width={18}
                  height={18}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {!hideSeparator && <Separator sx={{ marginLeft: 48 }} />}
    </Animated.View>
  )
}

function useBalanceForAccount(account: Account): {
  balance: number
  isLoadingBalance: boolean
  isBalanceAccurate: boolean
} {
  const { data: balances } = useUserBalances()
  const balance = useBalanceTotalInCurrencyForAccount({
    account: account,
    sourceData: balances[account.id]
  })
  const isBalanceAccurate = useIsAccountBalanceAccurate(account)

  return {
    balance,
    isLoadingBalance: balances?.[account.id] === undefined,
    isBalanceAccurate
  }
}
