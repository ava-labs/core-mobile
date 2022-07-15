import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import StarSVG from 'components/svg/StarSVG'
import InfoSVG from 'components/svg/InfoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import { alwaysFavoriteNetworks } from 'store/network'

type Props = {
  networkChainId: number
  networkName: string
  icon: string | JSX.Element
  isFavorite: boolean
  onPress: (chainId: number) => void
  onFavorite: (chainId: number) => void
  onInfo: (chainId: number) => void
}

export function NetworkListItem({
  networkChainId,
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
        {!alwaysFavoriteNetworks.includes(networkChainId) && (
          <AvaButton.Icon onPress={() => onFavorite(networkChainId)}>
            <StarSVG selected={isFavorite} />
          </AvaButton.Icon>
        )}
        <AvaButton.Icon onPress={() => onInfo(networkChainId)}>
          <InfoSVG size={24} color={theme.colorIcon1} />
        </AvaButton.Icon>
      </Row>
    )
  }

  return (
    <AvaListItem.Base
      onPress={() => onPress(networkChainId)}
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
