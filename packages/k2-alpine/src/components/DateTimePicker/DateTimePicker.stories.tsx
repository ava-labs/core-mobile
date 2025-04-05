import React, { useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { Button, useTheme } from '../..'
import { DateTimePicker } from './DateTimePicker'

export default {
  title: 'DateTimePicker'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const handleShowDateTimePicker = (): void => {
    setIsDatePickerVisible(true)
  }

  const handleDateSelected = (date: Date): void => {
    setSelectedDate(date)
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Button type="primary" size="large" onPress={handleShowDateTimePicker}>
          {selectedDate.toLocaleDateString()}
        </Button>
        <DateTimePicker
          date={selectedDate}
          isVisible={isDatePickerVisible}
          setIsVisible={setIsDatePickerVisible}
          onDateSelected={handleDateSelected}
        />
      </ScrollView>
    </View>
  )
}
