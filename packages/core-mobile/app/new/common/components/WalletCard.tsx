import {
  ActivityIndicator,
  Button,
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { AccountListItem } from 'features/wallets/components/AccountListItem'
import { computeAccountBalance } from 'features/portfolio/utils/computeAccountBalance'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import { WalletBalance } from 'features/wallets/components/WalletBalance'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { WalletType } from 'services/wallet/types'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectIsWalletLedger } from 'store/wallet/slice'
import { useSelector } from 'react-redux'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { DropdownMenu } from './DropdownMenu'
import { WalletIcon } from './WalletIcon'

const HEADER_HEIGHT = 64
const EXPAND_TIMING = {
  duration: 300,
  easing: Easing.bezier(0.25, 1, 0.5, 1)
}

const emptyAccountBalances: AdjustedNormalizedBalancesForAccount[] = []

interface WalletCardProps {
  wallet: WalletDisplayData
  isActive: boolean
  isExpanded: boolean
  isRefreshing: boolean
  showMoreButton?: boolean
  style?: StyleProp<ViewStyle>
  onToggleExpansion: (walletId: string) => void
  onSetActiveAccount: (accountId: string) => void
  onAccountDetails: (accountId: string) => void
}

const WalletCard = ({
  wallet,
  isActive,
  isExpanded,
  isRefreshing,
  showMoreButton = true,
  style,
  onToggleExpansion,
  onSetActiveAccount,
  onAccountDetails
}: WalletCardProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const accountIds = useMemo(
    () => wallet.accounts.map(a => a.account.id),
    [wallet.accounts]
  )
  const { data: walletBalancesData, isError: isBalancesError } =
    useWalletBalances(accountIds)

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  // Per-account count of enabled networks the account can actually produce
  // balances for. Necessary because wallets like Keystone cannot derive an
  // address for every globally enabled network (e.g. no Solana), so using
  // the global enabled-networks count would cause an infinite spinner — see
  // CP-14303.
  const enabledNetworksCountByAccount = useMemo(() => {
    const result: Record<string, number> = {}
    for (const item of wallet.accounts) {
      result[item.account.id] = getEnabledNetworksForAccount(
        item.account,
        enabledNetworks
      ).length
    }
    return result
  }, [wallet.accounts, enabledNetworks])

  const handleToggle = useCallback(() => {
    onToggleExpansion(wallet.id)
  }, [onToggleExpansion, wallet.id])

  const [contentHeight, setContentHeight] = useState(0)
  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setContentHeight(height)
  }, [])

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      minHeight: withTiming(
        isExpanded ? contentHeight + HEADER_HEIGHT : HEADER_HEIGHT,
        EXPAND_TIMING
      )
    }
  })

  const balanceSx = useMemo(
    () => ({
      color: isActive ? colors.$textPrimary : colors.$textSecondary
    }),
    [isActive, colors.$textPrimary, colors.$textSecondary]
  )

  const accountsList = useMemo(() => {
    if (!isExpanded) return null
    if (wallet.accounts.length === 0) {
      return (
        <View
          style={{
            paddingVertical: 20,
            alignItems: 'center',
            backgroundColor: colors.$surfaceSecondary
          }}>
          <Text style={{ color: colors.$textSecondary }}>
            No accounts in this wallet.
          </Text>
        </View>
      )
    }

    return wallet.accounts.map(item => {
      const balResult = computeAccountBalance({
        accountBalances:
          walletBalancesData[item.account.id] ?? emptyAccountBalances,
        enabledNetworksCount:
          enabledNetworksCountByAccount[item.account.id] ?? 0,
        enabledNetworksMap,
        enabledChainIds,
        isDeveloperMode,
        tokenVisibility,
        isError: isBalancesError
      })

      return (
        <AccountListItem
          key={item.account.id}
          testID={`manage_accounts_list__${wallet.name}__${item.account.name}`}
          displayData={item}
          isRefreshing={isRefreshing}
          balanceData={balResult}
          onSetActiveAccount={onSetActiveAccount}
          onAccountDetails={onAccountDetails}
        />
      )
    })
  }, [
    isExpanded,
    wallet.accounts,
    wallet.name,
    isRefreshing,
    onSetActiveAccount,
    onAccountDetails,
    colors.$surfaceSecondary,
    colors.$textSecondary,
    walletBalancesData,
    isBalancesError,
    enabledNetworksCountByAccount,
    enabledNetworksMap,
    enabledChainIds,
    isDeveloperMode,
    tokenVisibility
  ])

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
        onLayout={onContentLayout}
        sx={{
          paddingHorizontal: 10,
          gap: 10,
          paddingBottom: 10,
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0
        }}>
        {isExpanded && (
          <>
            <View style={{ paddingTop: 1 }}>{accountsList}</View>
            {wallet.type !== WalletType.PRIVATE_KEY && (
              <AddAccountButton wallet={wallet} />
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={handleToggle}
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
            <Icons.Navigation.ChevronRight
              color={colors.$textSecondary}
              width={20}
              height={20}
              transform={[{ rotate: isExpanded ? '-90deg' : '90deg' }]}
            />
            <WalletIcon wallet={wallet} isExpanded={isExpanded} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              flex: 1
            }}>
            <View style={{ flex: 1 }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}>
                <Text
                  testID={`manage_accounts_wallet_name__${wallet.name}`}
                  variant="heading4"
                  style={{
                    lineHeight: 27,
                    flexShrink: 1
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
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
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.$textSecondary
                }}>
                {(() => {
                  const accountCountText =
                    wallet.accounts.length > 1
                      ? `${wallet.accounts.length} accounts`
                      : '1 account'
                  const derivationPathLabel =
                    wallet.type === WalletType.LEDGER
                      ? LedgerDerivationPathType.BIP44
                      : wallet.type === WalletType.LEDGER_LIVE
                      ? LedgerDerivationPathType.LedgerLive
                      : null
                  return derivationPathLabel
                    ? `${derivationPathLabel} – ${accountCountText}`
                    : accountCountText
                })()}
              </Text>
            </View>
          </View>
        </View>

        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: showMoreButton ? 0 : 24
          }}>
          <WalletBalance
            balanceSx={balanceSx}
            isRefreshing={isRefreshing}
            walletBalancesData={walletBalancesData}
            isBalancesError={isBalancesError}
            enabledNetworksCountByAccount={enabledNetworksCountByAccount}
            enabledNetworksMap={enabledNetworksMap}
            enabledChainIds={enabledChainIds}
            isDeveloperMode={isDeveloperMode}
            tokenVisibility={tokenVisibility}
          />
          {showMoreButton && <WalletMoreMenu wallet={wallet} />}
        </View>
      </TouchableOpacity>

      <View sx={{ flex: 1 }} />
    </Animated.View>
  )
}

const WalletMoreMenu = React.memo(
  ({ wallet }: { wallet: WalletDisplayData }) => {
    const {
      theme: { colors }
    } = useTheme()
    const selectLedger = useMemo(
      () => selectIsWalletLedger(wallet.id),
      [wallet.id]
    )
    const isLedger = useSelector(selectLedger)
    const { getDropdownItems, handleDropdownSelect } = useManageWallet()

    return (
      <DropdownMenu
        testID={`more_icon__${wallet.name}`}
        groups={[
          {
            key: 'wallet-actions',
            items: getDropdownItems(wallet, isLedger)
          }
        ]}
        onPressAction={(event: { nativeEvent: { event: string } }) =>
          handleDropdownSelect(event.nativeEvent.event, wallet)
        }>
        <TouchableOpacity
          style={{
            minHeight: HEADER_HEIGHT,
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}>
          <View
            style={{
              minWidth: 54,
              paddingRight: 21,
              alignItems: 'flex-end'
            }}>
            <Icons.Navigation.MoreHoriz
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
        </TouchableOpacity>
      </DropdownMenu>
    )
  }
)

const AddAccountButton = React.memo(
  ({ wallet }: { wallet: WalletDisplayData }) => {
    const {
      theme: { colors }
    } = useTheme()
    const { handleAddAccount, isAddingAccount } = useManageWallet()

    return (
      <Button
        size="medium"
        leftIcon={
          isAddingAccount ? undefined : (
            <Icons.Content.Add
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          )
        }
        type="secondary"
        disabled={isAddingAccount}
        testID={`add_account_btn__${wallet.name}`}
        onPress={() => handleAddAccount(wallet)}>
        {isAddingAccount ? (
          <ActivityIndicator size="small" color={colors.$textPrimary} />
        ) : (
          'Add account'
        )}
      </Button>
    )
  }
)

function arePropsEqual(prev: WalletCardProps, next: WalletCardProps): boolean {
  if (
    prev.isActive !== next.isActive ||
    prev.isExpanded !== next.isExpanded ||
    prev.isRefreshing !== next.isRefreshing ||
    prev.showMoreButton !== next.showMoreButton ||
    prev.style !== next.style ||
    prev.onToggleExpansion !== next.onToggleExpansion ||
    prev.onSetActiveAccount !== next.onSetActiveAccount ||
    prev.onAccountDetails !== next.onAccountDetails
  ) {
    return false
  }

  if (prev.wallet === next.wallet) return true

  if (
    prev.wallet.id !== next.wallet.id ||
    prev.wallet.name !== next.wallet.name ||
    prev.wallet.type !== next.wallet.type ||
    prev.wallet.accounts.length !== next.wallet.accounts.length
  ) {
    return false
  }

  for (let i = 0; i < prev.wallet.accounts.length; i++) {
    const prevAcc = prev.wallet.accounts[i]
    const nextAcc = next.wallet.accounts[i]
    if (!prevAcc || !nextAcc) return false
    if (
      prevAcc.account.id !== nextAcc.account.id ||
      prevAcc.account.name !== nextAcc.account.name ||
      prevAcc.isActive !== nextAcc.isActive ||
      prevAcc.hideSeparator !== nextAcc.hideSeparator
    ) {
      return false
    }
  }

  return true
}

export default React.memo(WalletCard, arePropsEqual)
