import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import StarSVG from 'components/svg/StarSVG'
import InfoSVG from 'components/svg/InfoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { alwaysEnabledNetworks } from 'store/network'
import { NetworkLogo } from './NetworkLogo'

type Props = {
  networkChainId: number
  networkName: string
  logoUri: string
  isFavorite: boolean
  onPress: (chainId: number) => void
  onFavorite: (chainId: number) => void
  onInfo: (chainId: number) => void
  testID?: string
}

export function NetworkListItem({
  networkChainId,
  networkName,
  logoUri,
  isFavorite,
  onPress,
  onFavorite,
  onInfo
}: Props): JSX.Element {
  const { theme } = useApplicationContext()

  function getButtons(): JSX.Element {
    return (
      <Row style={{ alignItems: 'center' }}>
        {!alwaysEnabledNetworks.includes(networkChainId) && (
          <AvaButton.Icon
            testID={`star_svg__${networkName}`}
            onPress={() => onFavorite(networkChainId)}>
            <StarSVG selected={isFavorite} testID="star_svg" />
          </AvaButton.Icon>
        )}
        <AvaButton.Icon onPress={() => onInfo(networkChainId)}>
          <InfoSVG
            size={24}
            color={theme.colorIcon1}
            testID={`info_svg__${networkName}`}
          />
        </AvaButton.Icon>
      </Row>
    )
  }

  return (
    <AvaListItem.Base
      testID={`network_list_item__${networkName}`}
      onPress={() => onPress(networkChainId)}
      leftComponent={<NetworkLogo logoUri={logoUri} size={40} />}
      title={networkName}
      rightComponent={getButtons()}
    />
  )
}
