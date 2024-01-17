import React, { useState } from 'react'
import { Space } from 'components/Space'
import { Account } from 'store/account'
import AccountItem from 'screens/portfolio/account/AccountItem'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'react-redux'
import {
  addAccount,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import { Button, Text, View } from '@avalabs/k2-mobile'
import { ActivityIndicator } from 'components/ActivityIndicator'
import Logger from 'utils/Logger'
import { showSimpleToast } from 'components/Snackbar'
import WalletService from 'services/wallet/WalletService'
import AnalyticsService from 'services/analytics/AnalyticsService'

function AccountView({ onDone }: { onDone: () => void }): JSX.Element {
  const accounts = useSelector(selectAccounts)
  const dispatch = useDispatch()
  const [isAddingAccount, setIsAddingAccount] = useState(false)

  const addAccountAndSetActive = async (): Promise<void> => {
    try {
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: Object.keys(accounts).length + 1
      })

      setIsAddingAccount(true)
      // @ts-expect-error
      // dispatch here is not typed correctly
      await dispatch(addAccount()).unwrap()

      AnalyticsService.capture('CreatedANewAccountSuccessfully', {
        walletType: WalletService.walletType
      })
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSimpleToast('Unable to add account')
    } finally {
      setIsAddingAccount(false)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <Text variant="heading4">My Accounts</Text>
        <Button
          type="tertiary"
          size="xlarge"
          onPress={onDone}
          style={{ marginRight: -25 }}>
          Done
        </Button>
      </View>
      <Space y={16} />
      <BottomSheetFlatList
        style={{ marginHorizontal: -16 }}
        data={[...Object.values(accounts)]}
        renderItem={info => (
          <AccountItemRenderer
            account={info.item}
            onSelectAccount={accountIndex =>
              dispatch(setActiveAccountIndex(accountIndex))
            }
          />
        )}
      />

      <Button
        type="primary"
        size="xlarge"
        onPress={addAccountAndSetActive}
        disabled={isAddingAccount}>
        {isAddingAccount ? <ActivityIndicator size={'small'} /> : 'Add Account'}
      </Button>
      <Space y={16} />
    </View>
  )
}

function AccountItemRenderer({
  account,
  onSelectAccount
}: {
  account: Account
  onSelectAccount: (accountIndex: number) => void
}): JSX.Element {
  const activeAccount = useSelector(selectActiveAccount)
  return (
    <AccountItem
      key={account.title}
      account={account}
      editable
      selected={activeAccount?.index === account.index}
      onSelectAccount={onSelectAccount}
    />
  )
}

export default AccountView
