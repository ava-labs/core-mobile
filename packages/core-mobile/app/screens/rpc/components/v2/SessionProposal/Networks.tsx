import AvaText from 'components/AvaText'
import React, { JSX } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { useNetworks } from 'hooks/networks/useNetworks'
import AddSVG from 'components/svg/AddSVG'
import { View } from '@avalabs/k2-mobile'

type Props = {
  chainIds: number[]
  hasMore?: boolean
}

const Networks = ({ chainIds, hasMore = false }: Props): JSX.Element => {
  const { getSomeNetworks } = useNetworks()
  const networks = getSomeNetworks(chainIds)
  const theme = useApplicationContext().theme

  return (
    <Row>
      <AvaText.Heading3>Networks</AvaText.Heading3>
      <Row
        style={{
          flex: 1,
          marginRight: 6,
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
        {networks.map(network => (
          <NetworkLogo
            key={network.chainId}
            logoUri={network.logoUri}
            size={24}
            style={{
              marginRight: -6,
              borderWidth: 2,
              borderRadius: 12,
              backgroundColor: theme.colorBg3,
              borderColor: theme.colorBg2
            }}
          />
        ))}
        {hasMore && (
          <View
            style={{
              marginRight: -6,
              borderColor: theme.colorBg2,
              backgroundColor: theme.colorBg3,
              width: 24,
              height: 24,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2
            }}>
            <AddSVG color={theme.colorIcon1} hideCircle size={16} />
          </View>
        )}
      </Row>
    </Row>
  )
}

export default Networks
