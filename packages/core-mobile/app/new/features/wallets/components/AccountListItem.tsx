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
  const isMoto = theme.variant === 'moto'

  const handlePress = useCallback(() => {
    onSetActiveAccount(account.id)
  }, [onSetActiveAccount, account.id])

  const handlePressDetails = useCallback(() => {
    onAccountDetails(account.id)
  }, [onAccountDetails, account.id])

  // Hello UI: active row tints with the Whale primary at 12% instead of
  // the legacy black-at-10%; info button becomes a filled circular badge
  // (blue when active, light gray otherwise).
  const activeRowBg = isMoto
    ? alpha(theme.colors.$primary, 0.12)
    : alpha(theme.colors.$textPrimary, 0.1)

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          borderRadius: 12,
          height: 52,
          backgroundColor: isActive ? activeRowBg : 'transparent'
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
                {isMoto ? (
                  /* Hello UI: 24dp circular info badge. Active row gets
                     the Whale primary fill with white glyph; inactive
                     rows get a Vellum-tinted fill with secondary glyph.
                     We render a plain "i" Text rather than the AlertCircle
                     icon — that icon already has a circle baked in, which
                     would visually stack inside this badge. */
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isActive
                        ? theme.colors.$primary
                        : theme.colors.$borderPrimary,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <Text
                      sx={{
                        fontFamily: 'Rookery-Bold',
                        fontSize: 13,
                        lineHeight: 13,
                        color: isActive
                          ? theme.colors.$onPrimary
                          : theme.colors.$textSecondary
                      }}>
                      i
                    </Text>
                  </View>
                ) : (
                  <Icons.Alert.AlertCircle
                    color={theme.colors.$textPrimary}
                    width={18}
                    height={18}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {!hideSeparator && <Separator sx={{ marginLeft: 46 }} />}
    </View>
  )
}

const MemoizedAccountListItem = React.memo(AccountListItem)
export { MemoizedAccountListItem as AccountListItem }
