import React, { useState } from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { RadioButton } from 'components/RadioButton'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'RadioButton',
  decorators: [withCenterView]
} as Meta

export const Basic: ComponentStory<typeof RadioButton> = ({
  selected,
  children,
  unselectedColor,
  selectedColor
}) => {
  const [toggle, setToggle] = useState(false)

  return (
    <RadioButton
      selected={selected || toggle}
      onPress={() => setToggle(!toggle)}
      unselectedColor={unselectedColor}
      selectedColor={selectedColor}>
      <View style={{ marginLeft: 10 }}>
        <AvaText.Body1 textStyle={{ color: 'white' }}>{children}</AvaText.Body1>
      </View>
    </RadioButton>
  )
}

Basic.args = {
  selected: false,
  children: 'Radio Button',
  unselectedColor: 'white',
  selectedColor: 'blue'
}
