import { BNInput } from 'components/BNInput'
import OvalTagBg from 'components/OvalTagBg'
import { Row } from 'components/Row'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import BN from 'bn.js'

const EarnInputAmount = ({
  inputAmountBN,
  denomination,
  handleAmountChange
}: {
  inputAmountBN?: BN
  denomination: number
  handleAmountChange?: (value: { bn: BN; amount: string }) => void
}) => {
  const { theme } = useApplicationContext()

  return (
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        width: 250
      }}>
      <BNInput
        value={inputAmountBN}
        denomination={denomination}
        placeholder={'0.0'}
        onChange={handleAmountChange}
        style={{
          margin: 0
        }}
        autoFocus={true}
        textStyle={{
          fontFamily: 'Inter-Bold',
          fontSize: 48,
          lineHeight: 56
        }}
        backgroundColor={theme.transparent}
      />
      <OvalTagBg
        color={theme.neutral900}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4
        }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaLogoSVG
            size={16}
            logoColor={theme.tokenLogoColor}
            backgroundColor={theme.tokenLogoBg}
          />
          <Space x={4} />
          <AvaText.ButtonSmall>AVAX</AvaText.ButtonSmall>
        </Row>
      </OvalTagBg>
    </Row>
  )
}

export default EarnInputAmount
