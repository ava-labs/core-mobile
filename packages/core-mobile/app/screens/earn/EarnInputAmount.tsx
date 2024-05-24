import OvalTagBg from 'components/OvalTagBg'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import React, { useEffect, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Platform } from 'react-native'
import limitInput, { getMaxDecimals } from 'screens/earn/limitInput'
import { TokenBaseUnitInput } from 'components/TokenBaseUnitInput'
import { Avax } from 'types/Avax'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import Avatar from 'components/Avatar'

const EarnInputAmount = ({
  inputAmount,
  handleAmountChange
}: {
  inputAmount?: Avax
  handleAmountChange?: (amount: Avax) => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const [maxDecimals, setMaxDecimals] = useState(
    inputAmount?.getMaxDecimals ?? 0
  )
  const network = useCChainNetwork()

  const isAndroid = Platform.OS === 'android'

  useEffect(() => {
    const sanitized = limitInput(inputAmount)
    if (sanitized && inputAmount && !sanitized.eq(inputAmount)) {
      handleAmountChange?.(sanitized)
    }
  }, [handleAmountChange, inputAmount])

  useEffect(() => {
    if (!inputAmount) return
    setMaxDecimals(getMaxDecimals(inputAmount) ?? inputAmount.getMaxDecimals())
  }, [inputAmount])

  const interceptAmountChange = (amount: Avax): void => {
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
        maxDecimals={maxDecimals}
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
          {network?.networkToken !== undefined && (
            <Avatar.Token
              size={16}
              name={network.networkToken.name}
              symbol={network.networkToken.symbol}
              logoUri={network.networkToken.logoUri}
            />
          )}
          <Space x={4} />
          <AvaText.ButtonSmall>AVAX</AvaText.ButtonSmall>
        </Row>
      </OvalTagBg>
    </Row>
  )
}

export default EarnInputAmount
