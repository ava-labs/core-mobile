import OvalTagBg from 'components/OvalTagBg'
import { Row } from 'components/Row'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import React, { useEffect } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Platform } from 'react-native'
import { DenominationNAvax } from 'types/denominations'
import limitInput from 'screens/earn/limitInput'
import { TokenBaseUnitInput } from 'components/TokenBaseUnitInput'
import { Avax } from 'types/Avax'

const EarnInputAmount = ({
  inputAmount,
  decimals,
  handleAmountChange
}: {
  inputAmount?: Avax
  decimals: DenominationNAvax
  handleAmountChange?: (amount: Avax) => void
}) => {
  const { theme } = useApplicationContext()

  const isAndroid = Platform.OS === 'android'

  useEffect(() => {
    const sanitized = limitInput(inputAmount)
    if (sanitized && inputAmount && !sanitized.eq(inputAmount)) {
      handleAmountChange?.(sanitized)
    }
  }, [decimals, handleAmountChange, inputAmount])

  const interceptAmountChange = (amount: Avax) => {
    const sanitized = limitInput(amount) ?? Avax.fromBase(0)
    handleAmountChange?.(sanitized)
  }

  return (
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16
      }}>
      <TokenBaseUnitInput
        value={inputAmount}
        baseUnitConstructor={Avax}
        denomination={decimals}
        placeholder={'0.0'}
        onChange={interceptAmountChange}
        style={{
          margin: 0,
          minWidth: isAndroid ? 110 : 0
        }}
        autoFocus={true}
        textStyle={{
          fontFamily: 'Inter-Bold',
          fontSize: 48,
          lineHeight: 56,
          textAlign: 'right'
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
