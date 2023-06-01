import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import CalendarSVG from 'components/svg/CalendarSVG'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { Opacity50 } from 'resources/Constants'
import { format } from 'date-fns'

interface CalendarInputProps {
  isDatePickerVisible: boolean
  setIsDatePickerVisible: (value: boolean) => void
  date: Date | undefined
  handleDateConfirm: (date: Date) => void
  placeHolder: string
}

export const CalendarInput: React.FC<CalendarInputProps> = ({
  date,
  isDatePickerVisible,
  setIsDatePickerVisible,
  handleDateConfirm,
  placeHolder
}) => {
  const { theme } = useApplicationContext()
  const showDatePicker = () => {
    setIsDatePickerVisible(true)
  }

  const hideDatePicker = () => {
    setIsDatePickerVisible(false)
  }

  return (
    <View>
      <Pressable
        style={{
          ...styles.dateInput,
          borderColor: theme.neutral700 + Opacity50,
          backgroundColor: theme.neutral900
        }}
        onPress={showDatePicker}>
        <AvaText.Body1 textStyle={{ color: theme.neutral50 }}>
          {date ? format(date, 'MMMM dd, yyyy') : placeHolder}
        </AvaText.Body1>
        <View style={styles.icon}>
          <AvaButton.Icon onPress={showDatePicker}>
            <CalendarSVG selected={true} />
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
