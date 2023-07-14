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
import { AmountChange } from 'screens/earn/types'
import { BigIntNavax, DenominationNavax } from 'types/denominations'
import { BigintInput } from 'components/BigintInput'

const EarnInputAmount = ({
  inputAmount,
  decimals,
  handleAmountChange
}: {
  inputAmount?: BigIntNavax
  decimals: DenominationNavax
  handleAmountChange?: (change: AmountChange) => void
}) => {
  const { theme } = useApplicationContext()

  const isAndroid = Platform.OS === 'android'

  useEffect(() => {
    const sanitized: BigIntNavax | undefined = sanitizeInput(
      inputAmount,
      decimals
    )
    if (sanitized && inputAmount && sanitized !== inputAmount) {
      handleAmountChange?.({
        amountString: bnToLocaleString(new BN(sanitized.toString()), decimals),
        amount: sanitized
      })
    }
  }, [decimals, handleAmountChange, inputAmount])

  const interceptAmountChange = (value: AmountChange) => {
    const sanitized: BigIntNavax = sanitizeInput(value.amount, decimals) ?? 0n
    handleAmountChange?.({
      amountString: bnToLocaleString(new BN(sanitized.toString()), decimals),
      amount: sanitized
    })
  }

  return (
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16
      }}>
      <BigintInput
        value={inputAmount}
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
