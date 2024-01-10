import React, { FC, useCallback, useState } from 'react'
import Sheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetHandleProps
} from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import AvaxSheetHandle from './AvaxSheetHandle'
import TabViewBackground from './TabViewBackground'

interface BottomSheetProps {
  backdropComponent?: FC<BottomSheetBackdropProps>
  handleComponent?: FC<BottomSheetHandleProps>
  animateOnMount?: boolean
  snapPoints?: string[]
  enablePanDownToClose?: boolean
  backgroundComponent?: FC<BottomSheetBackgroundProps>
  onClose?: () => void
  enableContentPanningGesture?: boolean
}

export const BottomSheet: FC<BottomSheetProps> = ({
  backdropComponent,
  backgroundComponent,
  handleComponent,
  animateOnMount,
  snapPoints,
  enablePanDownToClose,
  onClose,
  enableContentPanningGesture,
  children
}) => {
  const { goBack } = useNavigation()
  const defaultSnapPoints = ['94%']
  // -1 means the bottom sheet is closed
  const [setBottomShetIndex, setBottomSheetIndex] = useState(-1)

  const renderBottomSheetBackdrop = useCallback(props => {
    return (
      <BottomSheetBackdrop
        {...props}
        opacity={0.6}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    )
  }, [])

  function handleChange(index: number): void {
    setBottomSheetIndex(index)
  }

  function handleClose(): void {
    // onClose is called for the initial render, so we need to check if the bottom sheet is actually open
    // https://github.com/gorhom/react-native-bottom-sheet/issues/1541
    if (setBottomShetIndex !== -1) {
      onClose ? onClose() : goBack()
    }
  }

  return (
    <Sheet
      backdropComponent={backdropComponent ?? renderBottomSheetBackdrop}
      handleComponent={handleComponent ?? AvaxSheetHandle}
      animateOnMount={animateOnMount}
      snapPoints={snapPoints ?? defaultSnapPoints}
      enablePanDownToClose={enablePanDownToClose ?? true}
      backgroundComponent={backgroundComponent ?? TabViewBackground}
      onClose={handleClose}
      onChange={handleChange}
      enableContentPanningGesture={enableContentPanningGesture}>
      {children}
    </Sheet>
  )
}
