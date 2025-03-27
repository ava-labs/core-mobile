import { FeeSelector } from 'components/NetworkFeeSelector'
import React from 'react'
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
  onSelect
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any): React.JSX.Element => {
  return <FeeSelector label={label} selected={selected} onSelect={onSelect} />
}

Basic.args = {
  label: 'Fee',
  selected: false,
  value: '34'
}
