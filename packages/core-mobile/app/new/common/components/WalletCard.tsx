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
import React, { useCallback, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { PLATFORM_ACCOUNTS_VIRTUAL_WALLET_ID } from 'features/accountSettings/consts'
import { TotalAccountBalanceForWallet } from 'features/accountSettings/components/TotalAccountBalanceForWallet'
import { WalletType } from 'services/wallet/types'
import { TotalAccountBalanceForImportedAccounts } from 'features/accountSettings/components/TotalAccountBalanceForImportedAccounts'
import { DropdownMenu } from './DropdownMenu'

const ITEM_HEIGHT = 50

const WalletCard = ({
  wallet,
  isExpanded,
  searchText,
  onToggleExpansion,
  showMoreButton = true,
  style
}: {
  wallet: WalletDisplayData
  isExpanded: boolean
  searchText: string
  onToggleExpansion: () => void
  showMoreButton?: boolean
  style?: StyleProp<ViewStyle>
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { getDropdownItems, handleDropdownSelect } = useManageWallet()

  const accounts = useMemo(() => {
    return wallet.accounts.filter(
      account => !account.id.includes(PLATFORM_ACCOUNTS_VIRTUAL_WALLET_ID)
    )
  }, [wallet.accounts])

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
            padding: 10
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {renderExpansionIcon()}
            {renderWalletIcon()}
          </View>
          <View sx={{ flex: 1 }}>
            <Text
              testID={`manage_accounts_wallet_name__${wallet.name}`}
              variant="buttonSmall"
              numberOfLines={1}
              style={{
                fontSize: 14
              }}>
              {wallet.name}
            </Text>
            <Text
              testID={`manage_accounts_wallet_name__${wallet.name}`}
              variant="caption"
              numberOfLines={2}
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: colors.$textSecondary
              }}>
              {`${accounts.length} ${
                accounts.length > 1 ? 'accounts' : 'account'
              } + X/P Chains`}
            </Text>
          </View>
        </View>

        {/* total balance */}
        {wallet.type === WalletType.PRIVATE_KEY ? (
          <TotalAccountBalanceForImportedAccounts />
        ) : (
          <TotalAccountBalanceForWallet wallet={wallet} />
        )}

        {showMoreButton ? (
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
                paddingRight: 24,
                paddingLeft: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icons.Navigation.MoreHoriz
                color={colors.$textPrimary}
                width={20}
                height={20}
              />
            </TouchableOpacity>
          </DropdownMenu>
        ) : (
          <View style={{ width: 56, height: 20 }} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View sx={{ padding: 8, paddingTop: 0 }}>
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
        </View>
      )}
    </View>
  )
}

export default WalletCard
