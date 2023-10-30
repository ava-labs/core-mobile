import AvaButton from 'components/AvaButton'
import CheckBoxSVG from 'components/svg/CheckBoxSVG'
import CheckBoxEmptySVG from 'components/svg/CheckBoxEmptySVG'
import React from 'react'

interface Props {
  selected: boolean
  onPress?: () => void
}
export function Checkbox({ selected, onPress }: Props) {
  return (
    <AvaButton.Icon onPress={onPress}>
      {selected ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
    </AvaButton.Icon>
  )
}
