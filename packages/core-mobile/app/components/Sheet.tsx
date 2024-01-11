import React, { FC, useState } from 'react'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetHandle,
  BottomSheetHandleProps
} from '@gorhom/bottom-sheet'
import {
  Icons,
  Text,
  TouchableOpacity,
  View,
  useTheme
} from '@avalabs/k2-mobile'

interface SheetProps {
  title?: string
  onClose: () => void
}

/**
 * Sheets implementation for K2
 * https://www.figma.com/file/dAAQpFgjbBImwKZlSQ4IeF/K2-Mobile?type=design&node-id=241%3A7974&mode=design&t=k1ih8FZEFUHITe4H-1
 */
export const Sheet: FC<SheetProps> = ({ title, onClose, children }) => {
  const {
    theme: { colors }
  } = useTheme()

  const snapPoints = ['94%']
  // -1 means the bottom sheet is closed, according to @gorhom/bottom-sheet's implementation
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1)

  function handleChange(index: number): void {
    setBottomSheetIndex(index)
  }

  function handleClose(): void {
    // onClose is called for the initial render, so we need to check if the bottom sheet is actually open
    // https://github.com/gorhom/react-native-bottom-sheet/issues/1541
    if (bottomSheetIndex !== -1) {
      onClose()
    }
  }

  return (
    <BottomSheet
      backdropComponent={Backdrop}
      handleComponent={Handle}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundComponent={Background}
      onClose={handleClose}
      onChange={handleChange}
      enableContentPanningGesture={true}>
      <View
        sx={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
        <Text variant="heading4">{title}</Text>
        <TouchableOpacity onPress={handleClose}>
          <Icons.Navigation.Cancel
            color={colors.$neutral700}
            width={30}
            height={30}
          />
        </TouchableOpacity>
      </View>
      {children}
    </BottomSheet>
  )
}

const Background: FC<BottomSheetBackgroundProps> = props => {
  return (
    <View
      {...props}
      sx={{
        backgroundColor: '$neutral900',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12
      }}
    />
  )
}

const Backdrop: FC<BottomSheetBackdropProps> = props => {
  return (
    <BottomSheetBackdrop
      {...props}
      opacity={0.6}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  )
}

const Handle: FC<BottomSheetHandleProps> = props => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <BottomSheetHandle
      {...props}
      indicatorStyle={{ backgroundColor: colors.$neutral700 }}
    />
  )
}
