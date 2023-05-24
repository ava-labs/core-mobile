import { FeeSelector } from 'components/NetworkFeeSelector'
import React, { useState } from 'react'
import type { ComponentStory, Meta } from '@storybook/react-native'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'FeeSelector',
  decorators: [withCenterView],
  argTypes: {
    onSelect: { action: 'onSelect' }
  }
} as Meta

export const Basic: ComponentStory<typeof FeeSelector> = ({
  label,
  selected,
  onSelect,
  value
}) => {
  return (
    <FeeSelector
      label={label}
      selected={selected}
      value={value}
      onSelect={onSelect}
    />
  )
}

Basic.args = {
  label: 'Fee',
  selected: false,
  value: '34'
}

export const Editable: ComponentStory<typeof FeeSelector> = ({
  label,
  placeholder
}) => {
  const [value, setValue] = useState('20')
  const [selected, setSelected] = useState(false)
  return (
    <FeeSelector
      editable
      label={label}
      selected={selected}
      onSelect={() => setSelected(current => !current)}
      placeholder={placeholder}
      value={value}
      onValueEntered={setValue}
    />
  )
}

Editable.args = {
  label: 'Fee',
  editable: true,
  placeholder: 'place holder'
}
