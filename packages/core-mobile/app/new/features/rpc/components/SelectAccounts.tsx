import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  GroupList,
  Icons,
  Separator,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { CorePrimaryAccount } from '@avalabs/types'
import { AccountCollection } from 'store/account/types'
import { QueryStatus } from 'store/balance/types'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBalanceForAccount,
  selectBalanceStatus,
  selectBalanceTotalInCurrencyForAccount,
  selectIsBalanceLoadedForAccount
} from 'store/balance/slice'
import { selectTokenVisibility } from 'store/portfolio/slice'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'

type Props = {
  onSelect: (account: CorePrimaryAccount) => void
  selectedAccounts: CorePrimaryAccount[]
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
        title: (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <Icons.Custom.Wallet />
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
  account: CorePrimaryAccount
  onSelect: (account: CorePrimaryAccount) => void
  lastItem: boolean
  isSelected: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const tokenVisibility = useSelector(selectTokenVisibility)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(account.index, tokenVisibility)
  )
  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(account.index)
  )

  const balanceStatus = useSelector(selectBalanceStatus)
  const isBalanceLoading = balanceStatus !== QueryStatus.IDLE
  const { formatCurrency } = useFormatCurrency()
  const [showLoader, setShowLoader] = useState(false)
  const dispatch = useDispatch()

  const handleLoadBalance = useCallback(() => {
    dispatch(fetchBalanceForAccount({ accountIndex: account.index }))
    setShowLoader(true)
  }, [dispatch, account.index])

  useEffect(() => {
    if (!isBalanceLoading && showLoader) {
      setShowLoader(false)
    }
  }, [isBalanceLoading, showLoader])

  const renderBalance = useCallback(() => {
    if (showLoader) {
      return <ActivityIndicator style={{ marginRight: 14 }} size="small" />
    }

    if (!isBalanceLoaded) {
      return (
        <Button type="tertiary" size="small" onPress={handleLoadBalance}>
          View Balance
        </Button>
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
    showLoader,
    accountBalance,
    formatCurrency,
    handleLoadBalance,
    isBalanceLoaded
  ])

  return (
    <>
      <View
        key={account.index.toString()}
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
            {truncateAddress(account.addressC, 8)}
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
