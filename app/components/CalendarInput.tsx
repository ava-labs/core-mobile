import React, { useState } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import CalendarSVG from 'components/svg/CalendarSVG'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { format } from 'date-fns'

interface CalendarInputProps {
  date: Date | undefined
  onDateSelected: (date: Date) => void
  placeHolder: string
}

export const CalendarInput: React.FC<CalendarInputProps> = ({
  date,
  onDateSelected,
  placeHolder
}) => {
  const { theme } = useApplicationContext()
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const showDatePicker = () => {
    setIsDatePickerVisible(true)
  }

  const hideDatePicker = () => {
    setIsDatePickerVisible(false)
  }

  const handleDateConfirm = (dateInput: Date) => {
    onDateSelected(dateInput)
    setIsDatePickerVisible(false)
  }

  return (
    <View>
      <Pressable
        style={{
          ...styles.dateInput,
          backgroundColor: theme.colorText6
        }}
        onPress={showDatePicker}>
        <AvaText.Body1 textStyle={{ color: theme.colorText1 }}>
          {date ? format(date, 'MMMM dd, yyyy') : placeHolder}
        </AvaText.Body1>
        <View style={styles.icon}>
          <AvaButton.Icon onPress={showDatePicker}>
            <CalendarSVG selected={true} size={20} />
          </AvaButton.Icon>
        </View>
      </Pressable>
      <View>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
    right: 8,
    justifyContent: 'center',
    height: '100%'
  },
  dateInput: {
    marginVertical: 8,
    paddingVertical: 8,
    paddingLeft: 16,
    borderRadius: 8,
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center'
  }
})
