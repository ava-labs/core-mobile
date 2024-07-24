import AvaText from 'components/AvaText'
import React, { JSX } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { useNetworks } from 'hooks/networks/useNetworks'

type Props = {
  chainIds: number[]
}

const Networks = ({ chainIds }: Props): JSX.Element => {
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
          justifyContent: 'flex-end'
        }}>
        {networks.map(network => (
          <NetworkLogo
            key={network.chainId}
            logoUri={network.logoUri}
            size={24}
            style={{
              marginRight: -6,
              borderWidth: 2,
              borderColor: theme.colorBg2
            }}
          />
        ))}
      </Row>
    </Row>
  )
}

export default Networks
