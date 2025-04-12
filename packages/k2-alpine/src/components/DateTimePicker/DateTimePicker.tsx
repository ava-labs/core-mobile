import React from 'react'
// import DateTimePickerModal from 'react-native-modal-datetime-picker'
// import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../hooks'

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  onDateSelected,
  onCancel,
  setIsVisible,
  isVisible,
  minimumDate,
  maximumDate,
  testID,
  mode
}) => {
  const { theme } = useTheme()
  // const { bottom } = useSafeAreaInsets()

  const handleConfirm = (dateInput: Date): void => {
    onDateSelected(dateInput)

    setIsVisible(false)
  }
  const handleCancel = (): void => {
    onCancel?.()

    setIsVisible(false)
  }

  return null
  // return (
  //   <DateTimePickerModal
  //     date={date}
  //     testID={testID}
  //     display="inline"
  //     isVisible={isVisible}
  //     mode={mode ?? 'date'}
  //     onConfirm={handleConfirm}
  //     onChange={handleConfirm}
  //     onCancel={handleCancel}
  //     minimumDate={minimumDate}
  //     maximumDate={maximumDate}
  //     accentColor={theme.colors.$textPrimary}
  //     pickerStyleIOS={{
  //       alignSelf: 'center',
  //       paddingBottom: 12
  //     }}
  //     modalStyleIOS={{
  //       marginBottom: bottom + 16
  //     }}
  //   />
  // )
}

interface DateTimePickerProps {
  date?: Date
  onDateSelected: (date: Date) => void
  onCancel?: () => void
  setIsVisible: (value: boolean) => void
  isVisible: boolean
  minimumDate?: Date
  maximumDate?: Date
  testID?: string
  mode?: 'date' | 'time' | 'datetime'
}
