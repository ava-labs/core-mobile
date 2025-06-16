import React, { useCallback, useMemo } from 'react'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  GroupList,
  Icons,
  Pressable,
  Separator,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { Account, AccountCollection } from 'store/account/types'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'

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
                <Account
                  key={index}
                  account={account}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  lastItem={lastItem}
                />
              )
            })}
          </View>
        )
      }
    ]
  }, [accounts, colors.$textPrimary, onSelect, selectedAccounts])
  return <GroupList data={data} />
}

const Account = ({
  account,
  onSelect,
  lastItem,
  isSelected
}: {
  account: Account
  onSelect: (account: Account) => void
  lastItem: boolean
  isSelected: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    balance: accountBalance,
    isBalanceLoaded,
    isFetchingBalance,
    fetchBalance
  } = useBalanceForAccount(account.index)
  const { formatCurrency } = useFormatCurrency()

  const renderBalance = useCallback(() => {
    if (isFetchingBalance) {
      return <ActivityIndicator style={{ marginRight: 14 }} size="small" />
    }

    if (!isBalanceLoaded) {
      return (
        <Pressable onPress={fetchBalance} style={{ marginRight: 14 }}>
          <Icons.Custom.BalanceRefresh color={colors.$textPrimary} />
        </Pressable>
      )
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
        {formatCurrency({ amount: accountBalance })}
      </Text>
    )
  }, [
    isFetchingBalance,
    isBalanceLoaded,
    accountBalance,
    formatCurrency,
    fetchBalance,
    colors.$textPrimary
  ])

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
