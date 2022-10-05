import React, { useCallback, useEffect, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import TabViewBackground from 'components/TabViewBackground'

const LogoutScreen = ({
  onConfirm,
  onCancel
}: {
  onConfirm: () => void
  onCancel: () => void
}) => {
  const { theme } = useApplicationContext()
  return (
    <View
      style={[
        {
          borderRadius: 8,
          backgroundColor: theme.colorBg2,
          paddingVertical: 24,
          paddingHorizontal: 16,
          marginHorizontal: 16,
          marginVertical: 16,
          justifyContent: 'flex-end',
          position: 'absolute',
          bottom: 0
        }
      ]}>
      <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
        Have you recorded your recovery phrase?
      </AvaText.Heading2>
      <AvaText.Body2 textStyle={{ textAlign: 'center', marginVertical: 16 }}>
        Without this you will not be able to sign back in to your account.
      </AvaText.Body2>
      <AvaButton.PrimaryLarge onPress={onConfirm}>Yes</AvaButton.PrimaryLarge>
      <Space y={8} />
      <AvaButton.TextLarge onPress={onCancel}>No</AvaButton.TextLarge>
    </View>
  )
}

const MyHandle = () => {
  return <Space y={24} />
}
const snapPoints = ['40%']

const SignOutBottomSheet = ({ onConfirm }: { onConfirm: () => void }) => {
  const { goBack, canGoBack } = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.expand()
    }, 100)
  }, [])

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      onClose={onClose}
      enablePanDownToClose
      snapPoints={snapPoints}
      handleComponent={MyHandle}
      backgroundComponent={TabViewBackground}
      backdropComponent={BottomSheetBackdrop}>
      <LogoutScreen onConfirm={onConfirm} onCancel={() => goBack()} />
    </BottomSheet>
  )
}

export default SignOutBottomSheet
