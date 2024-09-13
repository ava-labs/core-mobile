import React, {
  useCallback,
  type FC,
  type PropsWithChildren,
  type RefObject
} from 'react'
import BT, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetProps
} from '@gorhom/bottom-sheet'

type Props = {
  sheetRef?: RefObject<BT>
} & Pick<BottomSheetProps, 'enablePanDownToClose'>

export const BottomSheet: FC<PropsWithChildren<Props>> = ({
  children,
  sheetRef,
  enablePanDownToClose = true
}) => {
  const renderBottomSheetBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      return (
        <BottomSheetBackdrop
          {...props}
          opacity={0.15}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          style={[props.style, { backgroundColor: '#1E1E1E' }]}
        />
      )
    },
    []
  )

  return (
    <BT
      ref={sheetRef}
      snapPoints={['90%']}
      style={{ paddingHorizontal: 16 }}
      handleStyle={{ paddingTop: 10, paddingBottom: 16 }}
      backgroundStyle={{ borderTopRightRadius: 40, borderTopLeftRadius: 40 }}
      handleIndicatorStyle={{
        backgroundColor: '#1E1E1E',
        opacity: 0.15,
        width: 50,
        height: 5
      }}
      backdropComponent={renderBottomSheetBackdrop}
      enablePanDownToClose={enablePanDownToClose}>
      <BottomSheetView>{children}</BottomSheetView>
    </BT>
  )
}
