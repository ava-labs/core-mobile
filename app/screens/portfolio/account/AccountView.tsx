import React from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Account } from 'dto/Account'
import AccountItem from 'screens/portfolio/account/AccountItem'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { walletServiceInstance } from 'services/wallet/WalletService'
import { useSelector } from 'react-redux'
import {
  selectAccounts,
  selectActiveAccount
} from 'store/accounts/accountsStore'
import { activateAccount, addAccount } from 'services/accounts/AccountsService'
import { store } from 'store'

function AccountView({ onDone }: { onDone: () => void }): JSX.Element {
  const { theme } = useApplicationContext()
  const accounts = useSelector(selectAccounts)

  const addAccountAndSetActive = async () => {
    const acc = await addAccount(walletServiceInstance, accounts, store)
    activateAccount(acc.index, store)
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
        <AvaText.Heading1>My accounts</AvaText.Heading1>
        <AvaButton.Base rippleBorderless onPress={onDone}>
          <AvaText.ButtonLarge textStyle={{ color: theme.colorPrimary1 }}>
            Done
          </AvaText.ButtonLarge>
        </AvaButton.Base>
      </View>
      <Space y={16} />
      <BottomSheetFlatList
        style={{ marginHorizontal: -16 }}
        data={[...Object.values(accounts)]}
        renderItem={info => (
          <AccountItemRenderer
            account={info.item}
            onSelectAccount={accountIndex =>
              activateAccount(accountIndex, store)
            }
          />
        )}
      />
      <AvaButton.PrimaryLarge onPress={addAccountAndSetActive}>
        Add Account
      </AvaButton.PrimaryLarge>
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
}) {
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
