import React from 'react'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../hooks'

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  onDateSelected,
  setIsVisible,
  isVisible,
  minimumDate,
  maximumDate,
  testID,
  mode
}) => {
  const { theme } = useTheme()
  const { bottom } = useSafeAreaInsets()

  const handleConfirm = (dateInput: Date): void => {
    onDateSelected(dateInput)

    setIsVisible(false)
  }
  const handleCancel = (): void => {
    setIsVisible(false)
  }

  return (
    <DateTimePickerModal
      date={date}
      testID={testID}
      display="inline"
      isVisible={isVisible}
      mode={mode ?? 'date'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      accentColor={theme.colors.$textPrimary}
      pickerStyleIOS={{
        alignSelf: 'center',
        paddingBottom: 12
      }}
      modalStyleIOS={{
        marginBottom: bottom + 16
      }}
    />
  )
}

interface DateTimePickerProps {
  date?: Date
  onDateSelected: (date: Date) => void
  setIsVisible: (value: boolean) => void
  isVisible: boolean
  minimumDate?: Date
  maximumDate?: Date
  testID?: string
  mode?: 'date' | 'time' | 'datetime'
}
