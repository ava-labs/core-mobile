import React from 'react'
import AccountView from 'screens/portfolio/account/AccountView'
import { useNavigation } from '@react-navigation/native'
import { Sheet } from 'components/Sheet'

function AccountBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()

  return (
    <Sheet>
      <AccountView onDone={() => goBack()} />
    </Sheet>
  )
}

export default AccountBottomSheet
