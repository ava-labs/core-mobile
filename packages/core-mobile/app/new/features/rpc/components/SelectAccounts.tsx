import React, { useCallback, useMemo } from 'react'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  GroupList,
  Icons,
  Separator,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { Account, AccountCollection } from 'store/account/types'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import {
  computeAccountBalance,
  AccountBalanceData
} from 'features/portfolio/utils/computeAccountBalance'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useAllBalances } from 'features/portfolio/hooks/useAllBalances'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { useSelector } from 'react-redux'
import { WalletIcon } from 'common/components/WalletIcon'
import { selectAccountById } from 'store/account'
import { selectWalletById, selectWalletsCount } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

const emptyAccountBalances: AdjustedNormalizedBalancesForAccount[] = []

const defaultBalanceData: AccountBalanceData = {
  balance: 0,
  isLoadingBalance: true,
  hasBalanceData: false,
  dataAccurate: false,
  error: null
}

type Props = {
  onSelect: (account: Account) => void
  selectedAccounts: Account[]
  accounts: AccountCollection
}

export const SelectAccounts = ({
  onSelect,
  selectedAccounts,
  accounts
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: balancesData, isError: isBalancesError } = useAllBalances()

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  const enabledNetworksCountByAccount = useMemo(() => {
    const result: Record<string, number> = {}
    for (const account of Object.values(accounts)) {
      result[account.id] = getEnabledNetworksForAccount(
        account,
        enabledNetworks
      ).length
    }
    return result
  }, [accounts, enabledNetworks])

  const balancesByAccountId = useMemo(() => {
    const result: Record<string, AccountBalanceData> = {}
    for (const account of Object.values(accounts)) {
      result[account.id] = computeAccountBalance({
        accountBalances: balancesData[account.id] ?? emptyAccountBalances,
        enabledNetworksCount: enabledNetworksCountByAccount[account.id] ?? 0,
        enabledNetworksMap,
        enabledChainIds,
        isDeveloperMode,
        tokenVisibility,
        isError: isBalancesError
      })
    }
    return result
  }, [
    accounts,
    balancesData,
    isBalancesError,
    enabledNetworksCountByAccount,
    enabledNetworksMap,
    enabledChainIds,
    isDeveloperMode,
    tokenVisibility
  ])

  const data = useMemo(() => {
    const allAccounts = Object.values(accounts)

    return [
      {
        // eslint-disable-next-line react/no-unstable-nested-components
        title: (expanded: boolean) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            {expanded ? (
              <Icons.Custom.Wallet color={colors.$textPrimary} />
            ) : (
              <Icons.Custom.WalletClosed color={colors.$textPrimary} />
            )}
            <Text
              variant="body1"
              sx={{
                fontSize: 14,
                fontWeight: '500',
                color: '$textPrimary',
                marginLeft: 10
              }}>
              Select Accounts
            </Text>
          </View>
        ),
        value: (
          <Text
            variant="body1"
            sx={{
              fontSize: 14,
              color: alpha(colors.$textPrimary, 0.6),
              marginLeft: 10
            }}>
            {selectedAccounts.length} of {Object.keys(accounts).length}
          </Text>
        ),
        expanded: true,
        accordion: (
          <View style={{ marginVertical: 12 }}>
            {allAccounts.map((account, index) => {
              const lastItem = index === allAccounts.length - 1
              const isSelected =
                selectedAccounts.findIndex(
                  selectedAccount =>
                    selectedAccount.addressC === account.addressC
                ) !== -1

              return (
                <AccountItem
                  testID={`account__${account.name}`}
                  key={account.id}
                  account={account}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  lastItem={lastItem}
                  balanceData={
                    balancesByAccountId[account.id] ?? defaultBalanceData
                  }
                />
              )
            })}
          </View>
        )
      }
    ]
  }, [
    accounts,
    colors.$textPrimary,
    onSelect,
    selectedAccounts,
    balancesByAccountId
  ])
  return <GroupList data={data} />
}

const AccountItem = ({
  account,
  onSelect,
  lastItem,
  isSelected,
  testID,
  balanceData
}: {
  account: Account
  onSelect: (account: Account) => void
  lastItem: boolean
  isSelected: boolean
  testID?: string
  balanceData: AccountBalanceData
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const accountData = useSelector(selectAccountById(account.id))
  const wallet = useSelector(selectWalletById(accountData?.walletId ?? ''))
  const walletsCount = useSelector(selectWalletsCount)

  const renderBalance = useCallback(() => {
    if (balanceData.isLoadingBalance) {
      return <ActivityIndicator style={{ marginRight: 14 }} size="small" />
    }

    return (
      <Text
        variant="body1"
        numberOfLines={1}
        sx={{
          fontSize: 15,
          color: '$textPrimary',
          marginRight: 14,
          marginLeft: 20
        }}>
        {formatCurrency({ amount: balanceData.balance })}
      </Text>
    )
  }, [balanceData.isLoadingBalance, balanceData.balance, formatCurrency])

  const renderWalletBadge = useCallback(() => {
    if (!wallet || walletsCount <= 1) {
      return null
    }

    const walletLabel =
      wallet.type === WalletType.PRIVATE_KEY ? 'Imported' : wallet.name

    return (
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          marginBottom: 4
        }}>
        <WalletIcon
          wallet={wallet}
          width={16}
          height={16}
          isExpanded
          color={colors.$textSecondary}
        />
        <Text
          variant="buttonSmall"
          sx={{
            color: '$textSecondary',
            lineHeight: 16
          }}>
          {walletLabel}
        </Text>
      </View>
    )
  }, [wallet, walletsCount, colors.$textSecondary])

  return (
    <>
      <View
        key={account.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 16
        }}>
        <View style={{ width: '40%' }}>
          {renderWalletBadge()}
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              fontSize: 15,
              color: '$textPrimary'
            }}>
            {account.name}
          </Text>
          <Text
            variant="mono"
            sx={{
              fontSize: 12,
              color: alpha(colors.$textPrimary, 0.6)
            }}>
            {truncateAddress(account.addressC, TRUNCATE_ADDRESS_LENGTH)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '60%',
            justifyContent: 'flex-end'
          }}>
          <View>{renderBalance()}</View>
          <Toggle
            testID={testID}
            value={isSelected}
            onValueChange={() => {
              onSelect(account)
            }}
          />
        </View>
      </View>
      {!lastItem && (
        <Separator sx={{ marginHorizontal: 16, marginVertical: 12 }} />
      )}
    </>
  )
}
