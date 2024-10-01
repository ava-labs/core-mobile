import OvalTagBg from 'components/OvalTagBg'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import React, { useEffect, useMemo } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Platform } from 'react-native'
import limitInput, { getMaxDecimals } from 'screens/earn/limitInput'
import { TokenUnitInput } from 'components/TokenUnitInput'
import Avatar from 'components/Avatar'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { zeroTokenUnit } from 'utils/units/zeroValues'

const EarnInputAmount = ({
  inputAmount,
  handleAmountChange
}: {
  inputAmount: TokenUnit
  handleAmountChange?: (amount: TokenUnit) => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const maxDecimalDigits = useMemo(() => {
    return getMaxDecimals(inputAmount) ?? inputAmount.getMaxDecimals()
  }, [inputAmount])

  const isTestnet = useSelector(selectIsDeveloperMode)
  const network = NetworkService.getAvalancheNetworkP(isTestnet)

  const isAndroid = Platform.OS === 'android'

  useEffect(() => {
    const sanitized = limitInput(inputAmount)
    if (sanitized && inputAmount && !sanitized.eq(inputAmount)) {
      handleAmountChange?.(sanitized)
    }
  }, [handleAmountChange, inputAmount])

  const interceptAmountChange = (amount: TokenUnit): void => {
    const sanitized = limitInput(amount) ?? zeroTokenUnit(network.networkToken)
    handleAmountChange?.(sanitized)
  }

  return (
    <Row
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16
      }}>
      <TokenUnitInput
        value={inputAmount}
        maxTokenDecimals={inputAmount.getMaxDecimals()}
        maxDecimalDigits={maxDecimalDigits}
        tokenSymbol={inputAmount.getSymbol()}
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
