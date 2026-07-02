// app/new/features/wallets/components/WalletHeaderRow.tsx
import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import { WalletBalance } from 'features/wallets/components/WalletBalance'
import React, { useCallback, useMemo } from 'react'
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
import { DropdownMenu } from 'common/components/DropdownMenu'
import { WalletIcon } from 'common/components/WalletIcon'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const HEADER_HEIGHT = 64

const WalletHeaderRow = ({
  wallet,
  isActive,
  isExpanded,
  isRefreshing,
  cardPos,
  showMoreButton = true,
  onToggleExpansion
}: {
  wallet: WalletDisplayData
  isActive: boolean
  isExpanded: boolean
  isRefreshing: boolean
  cardPos: CardPos
  showMoreButton?: boolean
  onToggleExpansion: (walletId: string) => void
}): React.JSX.Element => {
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

  const balanceSx = useMemo(
    () => ({
      color: isActive ? colors.$textPrimary : colors.$textSecondary
    }),
    [isActive, colors.$textPrimary, colors.$textSecondary]
  )

  return (
    <CardRow cardPos={cardPos}>
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
          sx={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
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
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  testID={`manage_accounts_wallet_name__${wallet.name}`}
                  variant="heading4"
                  style={{ lineHeight: 27, flexShrink: 1 }}
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
    </CardRow>
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
          { key: 'wallet-actions', items: getDropdownItems(wallet, isLedger) }
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
            style={{ minWidth: 54, paddingRight: 21, alignItems: 'flex-end' }}>
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

function arePropsEqual(
  prev: React.ComponentProps<typeof WalletHeaderRow>,
  next: React.ComponentProps<typeof WalletHeaderRow>
): boolean {
  return (
    prev.isActive === next.isActive &&
    prev.isExpanded === next.isExpanded &&
    prev.isRefreshing === next.isRefreshing &&
    prev.cardPos === next.cardPos &&
    prev.showMoreButton === next.showMoreButton &&
    prev.onToggleExpansion === next.onToggleExpansion &&
    prev.wallet === next.wallet
  )
}

export default React.memo(WalletHeaderRow, arePropsEqual)
