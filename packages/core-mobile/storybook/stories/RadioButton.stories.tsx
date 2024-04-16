import React, { useState } from 'react'
import { RadioButton } from 'components/RadioButton'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'RadioButton',
  decorators: [withCenterView]
}

export const Basic = ({
  selected,
  children,
  unselectedColor,
  selectedColor
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any): React.JSX.Element => {
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
