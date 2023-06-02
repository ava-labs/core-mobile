import { BNInput } from 'components/BNInput'
import OvalTagBg from 'components/OvalTagBg'
import { Row } from 'components/Row'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import React, { useEffect } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import BN from 'bn.js'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { Platform } from 'react-native'
import sanitizeInput from 'screens/earn/sanitizeInput'

const EarnInputAmount = ({
  inputAmountBN,
  decimals,
  handleAmountChange
}: {
  inputAmountBN?: BN
  decimals: number
  handleAmountChange?: (value: { bn: BN; amount: string }) => void
}) => {
  const { theme } = useApplicationContext()

  const isAndroid = Platform.OS === 'android'

  useEffect(() => {
    const sanitized = sanitizeInput(inputAmountBN, decimals)
    if (sanitized && inputAmountBN && !sanitized.eq(inputAmountBN)) {
      handleAmountChange?.({
        amount: bnToLocaleString(sanitized, decimals),
        bn: sanitized
      })
    }
  }, [decimals, handleAmountChange, inputAmountBN])

  const interceptAmountChange = (value: { bn: BN; amount: string }) => {
    const sanitized = sanitizeInput(value.bn, decimals) ?? new BN(0)
    handleAmountChange?.({
      amount: bnToLocaleString(sanitized, decimals),
      bn: sanitized
    })
  }

  return (
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        width: 280
      }}>
      <BNInput
        value={inputAmountBN}
        denomination={decimals}
        placeholder={'0.0'}
        onChange={interceptAmountChange}
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
