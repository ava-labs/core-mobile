import {
  GroupList,
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { AccountBalance } from 'features/wallets/components/AccountBalance'
import React, { useCallback, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { DropdownMenu } from './DropdownMenu'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveWalletId } from 'store/wallet/slice'

const ITEM_HEIGHT = 50

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

  const totalBalance = useMemo(() => {
    return 0
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
          minHeight: 48
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            padding: 10,
            paddingVertical: 14
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
          {/* <AccountBalance accountId={wallet.accounts[0]?.id} isActive={true} /> */}
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
                hitSlop={8}
                style={{
                  minHeight: 48,
                  paddingRight: 22,
                  paddingLeft: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
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
        <View sx={{ padding: 8, paddingTop: 0, gap: 8 }}>
          {wallet.accounts.length > 0 ? (
            <GroupList itemHeight={ITEM_HEIGHT} data={wallet.accounts} />
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
