import React, { memo } from 'react'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NetworkLogo } from './NetworkLogo'
import { ProtocolLogo } from './ProtocolLogo'

interface Props {
  logoUrl?: string
  name?: string
  chainLogoUrl?: string
  chainName?: string
  goToProtocolPage?: () => void
  totalValueOfProtocolItems?: string
}

const DeFiPortfolioHeader = ({
  logoUrl,
  name,
  chainLogoUrl,
  chainName,
  goToProtocolPage,
  totalValueOfProtocolItems
}: Props) => {
  const { theme } = useApplicationContext()

  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Row
        style={{
          alignItems: 'center',
          flex: 1
        }}>
        <ProtocolLogo size={48} uri={logoUrl} />
        <View style={{ flex: 2, marginHorizontal: 8 }}>
          <AvaText.Heading5 ellipsizeMode="tail">{name ?? ''}</AvaText.Heading5>
          <Row
            style={{
              alignItems: 'center'
            }}>
            <NetworkLogo
              uri={chainLogoUrl}
              style={{
                marginRight: 6
              }}
            />
            <AvaText.Body1 color={theme.neutral400}>
              {chainName ?? ''}
            </AvaText.Body1>
          </Row>
        </View>
      </Row>
      <AvaButton.Base onPress={goToProtocolPage}>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.ActivityTotal color={theme.neutral50}>
            {totalValueOfProtocolItems}
          </AvaText.ActivityTotal>
          <Space y={6} />
          <LinkSVG color={theme.white} />
        </View>
      </AvaButton.Base>
    </Row>
  )
}

export const MemoizedDeFiPortfolioHeader = memo(DeFiPortfolioHeader)
