import {
  GroupList,
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import React, { useCallback } from 'react'
import { WalletDisplayData } from 'common/types'
import { DropdownMenu } from './DropdownMenu'

const ITEM_HEIGHT = 50

const WalletCard = ({
  wallet,
  isExpanded,
  searchText,
  onToggleExpansion,
  showMoreButton = true
}: {
  wallet: WalletDisplayData
  isExpanded: boolean
  searchText: string
  onToggleExpansion: () => void
  showMoreButton?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { dropdownItems, handleDropdownSelect, setActiveDropdownWalletId } =
    useManageWallet()

  const handleMorePress = useCallback(() => {
    setActiveDropdownWalletId(wallet.id)
  }, [setActiveDropdownWalletId, wallet.id])

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
    <>
      <View
        sx={{
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 12,
          overflow: 'hidden'
        }}>
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
              paddingHorizontal: 10
            }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {renderExpansionIcon()}
              {renderWalletIcon()}
            </View>
            <Text
              variant="buttonSmall"
              numberOfLines={1}
              style={{
                fontSize: 14,
                flex: 1
              }}>
              {wallet.name}
            </Text>
          </View>

          {showMoreButton && (
            <DropdownMenu
              groups={[
                {
                  key: 'wallet-actions',
                  items: dropdownItems
                }
              ]}
              onPressAction={(event: { nativeEvent: { event: string } }) =>
                handleDropdownSelect(
                  event.nativeEvent.event,
                  wallet.id,
                  wallet.name
                )
              }>
              <TouchableOpacity
                hitSlop={8}
                style={{
                  minHeight: 48,
                  paddingRight: 24,
                  paddingLeft: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleMorePress}>
                <Icons.Navigation.MoreHoriz
                  color={colors.$textSecondary}
                  width={20}
                  height={20}
                />
              </TouchableOpacity>
            </DropdownMenu>
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
    </>
  )
}

export default WalletCard
