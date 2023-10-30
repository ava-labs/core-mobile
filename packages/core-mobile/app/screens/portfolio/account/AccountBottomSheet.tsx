import React from 'react'
import AccountView from 'screens/portfolio/account/AccountView'
import { useNavigation } from '@react-navigation/native'
import { BottomSheet } from 'components/BottomSheet'

function AccountBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()

  return (
    <BottomSheet>
      <AccountView onDone={() => goBack()} />
    </BottomSheet>
  )
}

export default AccountBottomSheet
