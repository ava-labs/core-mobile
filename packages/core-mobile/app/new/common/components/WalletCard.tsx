import {
  ANIMATED,
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
import React, { useCallback, useState } from 'react'
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { WalletType } from 'services/wallet/types'
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
        color={colors.$textSecondary}
        width={20}
        height={20}
        transform={[{ rotate: isExpanded ? '-90deg' : '90deg' }]}
      />
    )
  }, [colors.$textSecondary, isExpanded])

  const renderWalletIcon = useCallback(() => {
    if (
      wallet.type === WalletType.LEDGER ||
      wallet.type === WalletType.LEDGER_LIVE
    ) {
      return <Icons.Custom.Ledger color={colors.$textPrimary} />
    }
    if (isExpanded) {
      return <Icons.Custom.Wallet color={colors.$textPrimary} />
    }
    return <Icons.Custom.WalletClosed color={colors.$textPrimary} />
  }, [colors.$textPrimary, isExpanded, wallet.type])

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
  }, [colors.$surfaceSecondary, colors.$textSecondary, searchText])

  const [contentHeight, setContentHeight] = useState(HEADER_HEIGHT)
  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContentHeight(height)
  }, [])

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      minHeight: withTiming(
        isExpanded ? contentHeight + HEADER_HEIGHT * 2 : HEADER_HEIGHT,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  return (
    <Animated.View
      style={[
        animatedContentStyle,
        {
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 16,
          overflow: 'hidden'
        },
        style
      ]}>
      <View
        sx={{
          paddingHorizontal: 10,
          gap: 10,
          paddingBottom: 10,
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0
        }}>
        <FlatList
          data={wallet.accounts}
          onLayout={onContentLayout}
          renderItem={renderAccountItem}
          keyExtractor={item => item.account.id}
          ListEmptyComponent={renderEmpty}
          scrollEnabled={false}
        />
        {renderBottom?.()}
      </View>

      <TouchableOpacity
        onPress={onToggleExpansion}
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: HEADER_HEIGHT,
          gap: 12
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
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  testID={`manage_accounts_wallet_name__${wallet.name}`}
                  variant="heading4"
                  style={{
                    lineHeight: 24
                  }}
                  numberOfLines={1}>
                  {wallet.name}
                </Text>
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
              <Text
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
          </View>
        </View>

        <View
          accessible={true}
          testID={`more_icon__${wallet.name}`}
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: showMoreButton ? 0 : 24
          }}>
          <WalletBalance
            balanceSx={{
              color: isActive ? colors.$textPrimary : colors.$textSecondary
            }}
            // wallet={wallet}
          />
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

      <View sx={{ flex: 1 }} />
    </Animated.View>
  )
}

export default WalletCard
