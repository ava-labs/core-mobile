import AvaButton from 'components/AvaButton'
import CheckBoxSVG from 'components/svg/CheckBoxSVG'
import CheckBoxEmptySVG from 'components/svg/CheckBoxEmptySVG'
import React from 'react'

interface Props {
  selected: boolean
  onPress?: () => void
  testID?: string
}
export function Checkbox({ selected, onPress, testID }: Props): JSX.Element {
  return (
    <AvaButton.Icon onPress={onPress} testID={testID}>
      {selected ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
    </AvaButton.Icon>
  )
}
