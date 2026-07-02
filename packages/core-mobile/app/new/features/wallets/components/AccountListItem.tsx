import {
  alpha,
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { AccountDisplayData } from 'common/types'
import React, { useCallback } from 'react'
import { AccountBalanceData } from 'features/portfolio/utils/computeAccountBalance'
import { AccountBalance } from './AccountBalance'

const AccountListItem = ({
  testID,
  displayData,
  isRefreshing,
  balanceData,
  onSetActiveAccount,
  onAccountDetails
}: {
  testID: string
  displayData: AccountDisplayData
  isRefreshing: boolean
  balanceData: AccountBalanceData
  onSetActiveAccount: (accountId: string) => void
  onAccountDetails: (accountId: string) => void
}): JSX.Element => {
  const { account, wallet, isActive, hideSeparator } = displayData
  const { theme } = useTheme()

  const handlePress = useCallback(() => {
    onSetActiveAccount(account.id)
  }, [onSetActiveAccount, account.id])

  const handlePressDetails = useCallback(() => {
    onAccountDetails(account.id)
  }, [onAccountDetails, account.id])

  return (
    <View
      sx={{
        backgroundColor: isActive
          ? alpha(theme.colors.$textPrimary, 0.1)
          : 'transparent',
        borderRadius: 12,
        height: 52
      }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 14,
          flex: 1
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
                balance={balanceData.balance}
                errorMessage={balanceData.error ?? ''}
                isLoading={balanceData.isLoadingBalance}
                isRefreshing={isRefreshing}
                hasLoaded={balanceData.hasBalanceData}
                isAccurate={balanceData.dataAccurate}
                variant="skeleton"
              />
              <TouchableOpacity
                hitSlop={16}
                onPress={handlePressDetails}
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
      {!hideSeparator && <Separator sx={{ marginLeft: 50 }} />}
    </View>
  )
}

const MemoizedAccountListItem = React.memo(AccountListItem)
export { MemoizedAccountListItem as AccountListItem }
