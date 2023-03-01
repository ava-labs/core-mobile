import AvaText from 'components/AvaText'
import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectSomeNetworks } from 'store/network'
import { Row } from 'components/Row'
import { NetworkLogo } from 'screens/network/NetworkLogo'

type Props = {
  chainIds: number[]
}

const Networks = ({ chainIds }: Props) => {
  const networks = useSelector(selectSomeNetworks(chainIds))
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
