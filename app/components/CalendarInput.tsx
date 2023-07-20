import React, { useRef, useState } from 'react'
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
  minimumDate?: Date
  maximumDate?: Date
}

export const CalendarInput: React.FC<CalendarInputProps> = ({
  date,
  onDateSelected,
  placeHolder,
  minimumDate,
  maximumDate
}) => {
  const { theme } = useApplicationContext()
  const positionRef = useRef<View>(null)
  const [position, setPosition] = useState(0)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const showDatePicker = () => {
    setIsDatePickerVisible(true)
  }

  const handleDateConfirm = (dateInput: Date) => {
    onDateSelected(dateInput)
    setIsDatePickerVisible(false)
  }

  const handleCancel = () => {
    setIsDatePickerVisible(false)
  }

  const EmptyComponent = () => null

  const handlOnLayout = () => {
    positionRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPosition(pageY + height)
    })
  }

  return (
    <View onLayout={handlOnLayout} ref={positionRef}>
      <Pressable
        style={{
          ...styles.dateInput,
          backgroundColor: theme.colorBg2
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
          display="inline"
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={handleCancel}
          onChange={handleDateConfirm}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant="dark"
          accentColor={theme.colorPrimary1}
          pickerStyleIOS={{ backgroundColor: theme.neutral900 }}
          customCancelButtonIOS={EmptyComponent}
          customConfirmButtonIOS={EmptyComponent}
          modalStyleIOS={{
            width: '100%',
            margin: 0,
            justifyContent: 'flex-start',
            marginTop: position,
            paddingHorizontal: 16
          }}
          backdropStyleIOS={{ backgroundColor: 'transparent' }}
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
