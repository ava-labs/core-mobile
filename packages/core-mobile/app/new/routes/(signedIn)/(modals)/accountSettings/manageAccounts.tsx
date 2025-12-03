import { WalletList } from 'features/wallets/components/WalletList'
import React from 'react'

const ManageAccountsScreen = (): React.JSX.Element => {
  return <WalletList title="Manage accounts" hasSearch isModal />
}

export default ManageAccountsScreen
