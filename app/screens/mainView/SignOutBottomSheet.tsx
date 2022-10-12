import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints
} from '@gorhom/bottom-sheet'
import { Space } from 'components/Space'
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
  return (
    <View
      style={[
        {
          marginHorizontal: 16,
          marginVertical: 16
        }
      ]}>
      <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
        Are you sure you want to erase your wallet?
      </AvaText.Heading2>
      <AvaText.Body2 textStyle={{ textAlign: 'center', marginVertical: 16 }}>
        {
          'Your current wallet will be removed from this app permanently. This cannot be undone. \n\nYou can ONLY recover this wallet with your recovery phrase. Core wallet does not store your recovery phrase.'
        }
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

const SignOutBottomSheet = ({ onConfirm }: { onConfirm: () => void }) => {
  const { goBack, canGoBack } = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const initialSnapPoints = useMemo(() => ['25%', 'CONTENT_HEIGHT'], [])

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints)

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
      onClose={onClose}
      enablePanDownToClose
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      handleComponent={MyHandle}
      backgroundComponent={TabViewBackground}
      backdropComponent={BottomSheetBackdrop}>
      <BottomSheetView onLayout={handleContentLayout}>
        <LogoutScreen onConfirm={onConfirm} onCancel={() => goBack()} />
      </BottomSheetView>
    </BottomSheet>
  )
}

export default SignOutBottomSheet
