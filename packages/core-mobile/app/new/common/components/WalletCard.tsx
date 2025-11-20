import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { AccountDisplayData, WalletDisplayData } from 'common/types'
import { AccountListItem } from 'features/wallets/components/AccountListItem'
import { WalletBalance } from 'features/wallets/components/WalletBalance'
import React, { useCallback } from 'react'
import { FlatList, ListRenderItem, StyleProp, ViewStyle } from 'react-native'
import { DropdownMenu } from './DropdownMenu'

const HEADER_HEIGHT = 64

const WalletCard = ({
  wallet,
  isActive,
  isExpanded,
  searchText,
  showMoreButton = true,
  style,
  renderBottom,
  onToggleExpansion
}: {
  wallet: WalletDisplayData
  isActive: boolean
  isExpanded: boolean
  searchText: string
  showMoreButton?: boolean
  style?: StyleProp<ViewStyle>
  renderBottom?: () => React.JSX.Element
  onToggleExpansion: () => void
}): React.JSX.Element => {
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

  const renderAccountItem: ListRenderItem<AccountDisplayData> = useCallback(
    ({ item }) => {
      return (
        <AccountListItem
          testID={`manage_accounts_list__${item.account.name}`}
          {...item}
        />
      )
    },
    []
  )

  const renderEmpty = useCallback(() => {
    if (!searchText) {
      return (
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
    }

    return null
  }, [])

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
              gap: 2,
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
                {wallet.accounts.length > 1
                  ? `${wallet.accounts.length} accounts`
                  : '1 account'}
              </Text>
            </View>
            {isActive && (
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

        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: showMoreButton ? 0 : 24
          }}>
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
          <FlatList
            data={wallet.accounts}
            renderItem={renderAccountItem}
            keyExtractor={item => item.account.id}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={false}
          />
          {renderBottom?.()}
        </View>
      )}
    </View>
  )
}

export default WalletCard
