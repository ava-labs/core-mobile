import React, { useState } from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { View } from 'react-native'
import { CalendarInput } from 'components/CalendarInput'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'CalendarInput',
  decorators: [withCenterView]
} as Meta

export const Basic: ComponentStory<typeof CalendarInput> = () => {
  const [date, setDate] = useState<Date>()
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)

  const onDateSelected = (dateInput: Date) => {
    setDate(dateInput)
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 16 }}>
      <CalendarInput
        date={date}
        onDateSelected={onDateSelected}
        placeHolder="March 22, 2024"
        isDatePickerVisible={isDatePickerVisible}
        setIsDatePickerVisible={setIsDatePickerVisible}
      />
    </View>
  )
}
