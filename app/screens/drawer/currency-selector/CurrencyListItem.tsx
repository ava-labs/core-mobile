import React, { FC } from 'react'
import AvaListItem from 'components/AvaListItem'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'

type Props = {
  name: string
  selected: boolean
  onPress: () => void
}

const CurrencyListItem: FC<Props> = ({ name, selected, onPress }) => {
  const theme = useApplicationContext().theme
  return (
    <>
      <AvaListItem.Base
        titleAlignment={'flex-start'}
        title={selected ? name : <AvaText.Body1>{name}</AvaText.Body1>}
        rightComponent={selected && <CheckmarkSVG />}
        rightComponentVerticalAlignment={'center'}
        background={selected ? theme.colorBg2 : theme.background}
        onPress={onPress}
      />
    </>
  )
}

export default CurrencyListItem
