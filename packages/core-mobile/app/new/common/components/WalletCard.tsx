import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { AccountListItem } from 'features/wallets/components/AccountListItem'
import { WalletBalance } from 'features/wallets/components/WalletBalance'
import React, { useCallback } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import { DropdownMenu } from './DropdownMenu'

const HEADER_HEIGHT = 64

const WalletCard = ({
  wallet,
  isExpanded,
  searchText,
  onToggleExpansion,
  showMoreButton = true,
  style,
  renderBottom
}: {
  wallet: WalletDisplayData
  isExpanded: boolean
  searchText: string
  onToggleExpansion: () => void
  showMoreButton?: boolean
  style?: StyleProp<ViewStyle>
  renderBottom?: () => React.JSX.Element
}): React.JSX.Element => {
  const activeWalletId = useSelector(selectActiveWalletId)

  const {
    theme: { colors }
  } = useTheme()
  const { getDropdownItems, handleDropdownSelect } = useManageWallet()

  const renderExpansionIcon = useCallback(() => {
    return (
      <Icons.Navigation.ChevronRight
        color={colors.$textPrimary}
        width={20}
        height={20}
        transform={[{ rotate: isExpanded ? '-90deg' : '90deg' }]}
      />
    )
  }, [colors.$textPrimary, isExpanded])

  const renderWalletIcon = useCallback(() => {
    if (isExpanded) {
      return <Icons.Custom.Wallet color={colors.$textPrimary} />
    }
    return <Icons.Custom.WalletClosed color={colors.$textPrimary} />
  }, [colors.$textPrimary, isExpanded])

  return (
    <View
      style={[
        {
          backgroundColor: colors.$surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.$borderPrimary,
          borderRadius: 12,
          overflow: 'hidden'
        },
        style
      ]}>
      <TouchableOpacity
        onPress={onToggleExpansion}
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: HEADER_HEIGHT
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flex: 1
          }}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingLeft: 5
            }}>
            {renderExpansionIcon()}
            {renderWalletIcon()}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              flex: 1
            }}>
            <View sx={{ gap: 2 }}>
              <Text
                testID={`manage_accounts_wallet_name__${wallet.name}`}
                variant="heading4"
                style={{
                  lineHeight: 24
                }}
                numberOfLines={1}>
                {wallet.name}
              </Text>
              <Text
                testID={`manage_accounts_wallet_name__${wallet.name}`}
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  lineHeight: 12,
                  color: colors.$textSecondary
                }}>
                {wallet.accounts.length} accounts
              </Text>
            </View>
            {activeWalletId === wallet.id && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: colors.$textSuccess,
                  borderRadius: 100
                }}
              />
            )}
          </View>
        </View>

        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <WalletBalance wallet={wallet} />
          {showMoreButton && (
            <DropdownMenu
              groups={[
                {
                  key: 'wallet-actions',
                  items: getDropdownItems(wallet)
                }
              ]}
              onPressAction={(event: { nativeEvent: { event: string } }) =>
                handleDropdownSelect(event.nativeEvent.event, wallet)
              }>
              <TouchableOpacity
                style={{
                  minHeight: HEADER_HEIGHT,
                  minWidth: 54,
                  paddingRight: 21,
                  justifyContent: 'center',
                  alignItems: 'flex-end'
                }}>
                <Icons.Navigation.MoreHoriz
                  color={colors.$textPrimary}
                  width={24}
                  height={24}
                />
              </TouchableOpacity>
            </DropdownMenu>
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View sx={{ paddingHorizontal: 10, gap: 10, paddingBottom: 10 }}>
          {wallet.accounts.length > 0 ? (
            <View>
              {wallet.accounts.map((account, index) => (
                <AccountListItem
                  key={index}
                  testID={`manage_accounts_list__${account.account.name}`}
                  {...account}
                />
              ))}
            </View>
          ) : (
            !searchText && (
              <View
                sx={{
                  paddingVertical: 20,
                  alignItems: 'center',
                  backgroundColor: colors.$surfaceSecondary
                }}>
                <Text sx={{ color: colors.$textSecondary }}>
                  No accounts in this wallet.
                </Text>
              </View>
            )
          )}
          {renderBottom?.()}
        </View>
      )}
    </View>
  )
}

export default WalletCard
