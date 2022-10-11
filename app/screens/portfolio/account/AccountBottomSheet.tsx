import React from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import AccountView from 'screens/portfolio/account/AccountView'
import TabViewBackground from 'components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import { useNavigation } from '@react-navigation/native'

const snapPoints = ['90%']

function AccountBottomSheet(): JSX.Element {
  const { goBack } = useNavigation()

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundComponent={TabViewBackground}
      onClose={goBack}>
      <AccountView onDone={() => goBack()} />
    </BottomSheet>
  )
}

export default AccountBottomSheet
