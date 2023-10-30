import React, { FC, useCallback } from 'react'
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

  return (
    <Sheet
      backdropComponent={backdropComponent ?? renderBottomSheetBackdrop}
      handleComponent={handleComponent ?? AvaxSheetHandle}
      animateOnMount={animateOnMount}
      snapPoints={snapPoints ?? defaultSnapPoints}
      enablePanDownToClose={enablePanDownToClose ?? true}
      backgroundComponent={backgroundComponent ?? TabViewBackground}
      onClose={onClose ?? goBack}
      enableContentPanningGesture={enableContentPanningGesture}>
      {children}
    </Sheet>
  )
}
