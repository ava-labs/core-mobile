import { FeeSelector } from 'components/NetworkFeeSelector'
import React, { useState } from 'react'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'FeeSelector',
  decorators: [withCenterView],
  argTypes: {
    onSelect: { action: 'onSelect' }
  }
}

export const Basic = ({
  label,
  selected,
  onSelect,
  value
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any): React.JSX.Element => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Editable = ({ label, placeholder }: any): React.JSX.Element => {
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
