import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import TabViewBackground from 'screens/portfolio/components/TabViewBackground'

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

const SignOutBottomSheet = ({ onConfirm }: { onConfirm: () => void }) => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { goBack, canGoBack } = useNavigation()
  const snapPoints = useMemo(() => ['0%', '40%'], [])

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(1)
    }, 50)
  }, [])

  const handleChange = useCallback(index => {
    if (index === 0 && canGoBack()) {
      goBack()
    }
  }, [])

  const MyHandle = () => {
    return <Space y={24} />
  }

  // renders
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      handleComponent={MyHandle}
      onChange={handleChange}
      backgroundComponent={TabViewBackground}
      backdropComponent={BottomSheetBackdrop}>
      <LogoutScreen onConfirm={onConfirm} onCancel={() => goBack()} />
    </BottomSheet>
  )
}

export default SignOutBottomSheet
