// app/new/features/wallets/components/AccountRow.tsx
import { View } from '@avalabs/k2-alpine'
import { AccountDisplayData } from 'common/types'
import { AccountListItem } from 'features/wallets/components/AccountListItem'
import { computeAccountBalance } from 'features/portfolio/utils/computeAccountBalance'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const emptyAccountBalances: AdjustedNormalizedBalancesForAccount[] = []

const AccountRow = ({
  account,
  cardPos,
  isRefreshing,
  onSetActiveAccount,
  onAccountDetails
}: {
  account: AccountDisplayData
  cardPos: CardPos
  isRefreshing: boolean
  onSetActiveAccount: (accountId: string) => void
  onAccountDetails: (accountId: string) => void
}): React.JSX.Element => {
  const accountId = account.account.id
  const accountIds = useMemo(() => [accountId], [accountId])
  const { data: walletBalancesData, isError: isBalancesError } =
    useWalletBalances(accountIds)

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  const balanceData = useMemo(() => {
    const enabledNetworksCount = getEnabledNetworksForAccount(
      account.account,
      enabledNetworks
    ).length
    return computeAccountBalance({
      accountBalances: walletBalancesData[accountId] ?? emptyAccountBalances,
      enabledNetworksCount,
      enabledNetworksMap,
      enabledChainIds,
      isDeveloperMode,
      tokenVisibility,
      isError: isBalancesError
    })
  }, [
    account.account,
    enabledNetworks,
    walletBalancesData,
    accountId,
    enabledNetworksMap,
    enabledChainIds,
    isDeveloperMode,
    tokenVisibility,
    isBalancesError
  ])

  return (
    <CardRow cardPos={cardPos}>
      <View
        sx={{
          paddingHorizontal: 10,
          paddingBottom: cardPos === 'bottom' ? 10 : 0
        }}>
        <AccountListItem
          testID={`manage_accounts_list__${account.wallet.name}__${account.account.name}`}
          displayData={account}
          isRefreshing={isRefreshing}
          balanceData={balanceData}
          onSetActiveAccount={onSetActiveAccount}
          onAccountDetails={onAccountDetails}
        />
      </View>
    </CardRow>
  )
}

function arePropsEqual(
  prev: React.ComponentProps<typeof AccountRow>,
  next: React.ComponentProps<typeof AccountRow>
): boolean {
  return (
    prev.cardPos === next.cardPos &&
    prev.isRefreshing === next.isRefreshing &&
    prev.onSetActiveAccount === next.onSetActiveAccount &&
    prev.onAccountDetails === next.onAccountDetails &&
    prev.account.account.id === next.account.account.id &&
    prev.account.account.name === next.account.account.name &&
    prev.account.wallet.name === next.account.wallet.name &&
    prev.account.isActive === next.account.isActive &&
    prev.account.hideSeparator === next.account.hideSeparator
  )
}

export default React.memo(AccountRow, arePropsEqual)
