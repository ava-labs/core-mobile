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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
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

  // Latest measured height of the in-flow content. Stored in a shared value so
  // it can drive the collapse/expand animation on the UI thread.
  const contentHeight = useSharedValue(0)
  // 0 = collapsed, 1 = expanded. This is the ONLY value that is time-animated,
  // and only on the user-initiated expand/collapse toggle.
  const expandProgress = useSharedValue(isExpanded ? 1 : 0)
  // True once the expand animation has fully settled. While true we render the
  // content in natural flow (auto height, overflow visible) so adding/removing
  // accounts grows/shrinks the card immediately, with no timing and no
  // clipping. During the collapse/expand transition (and while collapsed) we
  // fall back to the animated fixed height with overflow:'hidden'.
  const [isFullyExpanded, setIsFullyExpanded] = useState(isExpanded)
  const didMount = useRef(false)

  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      // Only record while expanded so the value stays at the full content
      // height when the content unmounts on collapse, letting the collapse
      // animation run smoothly from the full height down to 0.
      if (isExpanded) {
        contentHeight.value = event.nativeEvent.layout.height
      }
    },
    [isExpanded, contentHeight]
  )

  useEffect(() => {
    // Don't animate on the initial mount; `isFullyExpanded` already matches the
    // initial `isExpanded`.
    if (!didMount.current) {
      didMount.current = true
      return
    }

    // Use the animated fixed-height path for the duration of the toggle.
    setIsFullyExpanded(false)

    if (isExpanded) {
      expandProgress.value = withTiming(1, EXPAND_TIMING, finished => {
        if (finished) {
          runOnJS(setIsFullyExpanded)(true)
        }
      })
    } else {
      expandProgress.value = withTiming(0, EXPAND_TIMING)
    }
  }, [isExpanded, expandProgress])

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: expandProgress.value * contentHeight.value
    }
  })

  // Once expanded and settled, render in natural flow so the height tracks the
  // content intrinsically (immediate, never clipped). `isExpanded &&` ensures
  // we synchronously leave natural-flow mode the moment a collapse starts, so
  // the collapse animates from the full height instead of snapping shut.
  const useNaturalFlow = isExpanded && isFullyExpanded

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
        {
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 16,
          overflow: 'hidden'
        },
        style
      ]}>
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

      <Animated.View
        style={
          useNaturalFlow
            ? { overflow: 'visible' as const }
            : [animatedContentStyle, { overflow: 'hidden' as const }]
        }>
        <View
          onLayout={onContentLayout}
          sx={{
            paddingHorizontal: 10,
            gap: 10,
            paddingBottom: 10
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
      </Animated.View>
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
