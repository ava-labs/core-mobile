import React, { useMemo } from 'react'
import AvaButton from 'components/AvaButton'
import AvaListItem from 'components/AvaListItem'
import { Space } from 'components/Space'
import ClearSVG from 'components/svg/ClearSVG'
import Avatar from 'components/Avatar'
import { Checkbox } from 'components/Checkbox'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { getLogoIconUrl } from 'utils/getLogoIconUrl'
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
            logoUri={getLogoIconUrl(peerMeta.icons)}
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
