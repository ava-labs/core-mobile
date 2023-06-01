import React, { useState } from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { View } from 'react-native'
import { CalendarInput } from 'components/CalendarInput'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'CalendarInput',
  decorators: [withCenterView],
  argTypes: {
    onPress: { action: 'onPress' }
  }
} as Meta

export const Basic: ComponentStory<typeof CalendarInput> = () => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [date, setDate] = useState<Date>()

  const toggleDatePickerVisibility = (value: boolean) => {
    setDatePickerVisibility(value)
  }

  const handleDateConfirm = (dateInput: Date) => {
    setDate(dateInput)
    setDatePickerVisibility(false)
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 16 }}>
      <CalendarInput
        date={date}
        isDatePickerVisible={isDatePickerVisible}
        handleDateConfirm={handleDateConfirm}
        setIsDatePickerVisible={toggleDatePickerVisibility}
        placeHolder=" March 22, 2024"
      />
    </View>
  )
}

Basic.args = {
  //   selected: false,
  //   children: 'Radio Button',
  //   unselectedColor: 'white',
  //   selectedColor: 'blue'
}
