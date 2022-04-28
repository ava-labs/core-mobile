import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import StarSVG from 'components/svg/StarSVG'
import InfoSVG from 'components/svg/InfoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'

type Props = {
  networkName: string
  icon: string | JSX.Element
  isFavorite: boolean
  onPress: (networkName: string) => void
  onFavorite: (networkName: string) => void
  onInfo: (networkName: string) => void
}

export function NetworkListItem({
  networkName,
  icon,
  isFavorite,
  onPress,
  onFavorite,
  onInfo
}: Props) {
  const { theme } = useApplicationContext()

  function getButtons() {
    return (
      <Row style={{ alignItems: 'center' }}>
        <AvaButton.Icon onPress={() => onFavorite(networkName)}>
          <StarSVG selected={isFavorite} />
        </AvaButton.Icon>
        <AvaButton.Icon onPress={() => onInfo(networkName)}>
          <InfoSVG size={24} color={theme.colorIcon1} />
        </AvaButton.Icon>
      </Row>
    )
  }

  return (
    <AvaListItem.Base
      onPress={() => onPress(networkName)}
      leftComponent={
        typeof icon === 'string' ? (
          <Avatar.Custom size={40} name={networkName} logoUri={icon} />
        ) : (
          icon
        )
      }
      title={networkName}
      rightComponent={getButtons()}
    />
  )
}
