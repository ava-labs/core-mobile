import React, { useMemo } from 'react'
import AvaButton from 'components/AvaButton'
import AvaListItem from 'components/AvaListItem'
import { Space } from 'components/Space'
import ClearSVG from 'components/svg/ClearSVG'
import Avatar from 'components/Avatar'
import { Checkbox } from 'components/Checkbox'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Dapp } from './types'

interface Props {
  item: Dapp
  isEditing: boolean
  onSelect: (dapp: Dapp) => void
  onClear: (dapp: Dapp) => void
  selected: boolean
  testID?: string
}

export const DappItem = ({
  item,
  isEditing,
  onSelect,
  onClear,
  selected
}: Props): JSX.Element => {
  const theme = useApplicationContext().theme

  const peerMeta = useMemo(() => {
    return item.dapp.peer.metadata
  }, [item])

  const getIconUrl = (): string | undefined => {
    const icons = peerMeta.icons
    const iconCount = icons.length

    // try to get the icon with the highest resolution
    return iconCount > 2
      ? icons[2]
      : iconCount > 1
      ? icons[1]
      : iconCount === 1
      ? icons[0]
      : undefined
  }

  return (
    <AvaListItem.Base
      key={item.id}
      leftComponent={
        <Row style={{ alignItems: 'center' }}>
          {isEditing && (
            <>
              <Checkbox selected={selected} onPress={() => onSelect(item)} />
              <Space x={16} />
            </>
          )}
          <Avatar.Custom
            name={peerMeta.name}
            logoUri={getIconUrl()}
            testID="dapp_item__avatar"
          />
        </Row>
      }
      title={peerMeta.name}
      testID={peerMeta.name}
      rightComponent={
        isEditing ? null : (
          <AvaButton.Base
            onPress={() => onClear(item)}
            testID={`x_btn__${peerMeta.name}`}>
            <ClearSVG color={theme.white} backgroundColor={theme.background} />
          </AvaButton.Base>
        )
      }
      rightComponentVerticalAlignment={'center'}
    />
  )
}
