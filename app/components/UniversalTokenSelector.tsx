import React, { FC, useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { TokenWithBalance } from 'store/balance'
import { AssetBalance } from 'screens/bridge/utils/types'
import BN from 'bn.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { bnToLocaleString, numberToBN } from '@avalabs/utils-sdk'
import { Amount } from 'screens/swap/SwapView'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import CarrotSVG from 'components/svg/CarrotSVG'
import AvaButton from 'components/AvaButton'
import { BNInput } from 'components/BNInput'
import FlexSpacer from 'components/FlexSpacer'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'

interface Props {
  selectedToken?: TokenWithBalance
  onTokenChange: (token: TokenWithBalance | AssetBalance) => void
  hideInput?: boolean
  maxAmount?: BN
  inputAmount?: BN
  onAmountChange: ({ amount, bn }: { amount: string; bn: BN }) => void
  error?: string
  label?: string
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  skipHandleMaxAmount?: boolean
  onError?: (errorMessage: string) => void
}

const UniversalTokenSelector: FC<Props> = ({
  selectedToken,
  onTokenChange,
  hideInput,
  maxAmount,
  inputAmount,
  onAmountChange,
  error,
  label,
  isValueLoading,
  hideErrorMessage,
  skipHandleMaxAmount,
  onError
}) => {
  const theme = useApplicationContext().theme
  const currency = useSelector(selectSelectedCurrency)
  const [bnError, setBnError] = useState('')
  const [amountInCurrency, setAmountInCurrency] = useState<string>()
  const { currencyFormatter } = useApplicationContext().appHook
  const [isMaxAmount, setIsMaxAmount] = useState(false)
  const navigation = useNavigation()
  const maxAmountString = maxAmount
    ? bnToLocaleString(maxAmount, 18)
    : undefined
  const hasError = !!error || !!bnError

  const openTokenSelectorBottomSheet = () => {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: onTokenChange
    })
  }

  const handleAmountChange = useCallback(
    (value: Amount) => {
      if (!maxAmountString) {
        onAmountChange && onAmountChange(value)
        return
      }
      setIsMaxAmount(maxAmountString === value.amount)

      const wtf = currencyFormatter(
        Number(value?.amount ?? 0) * (selectedToken?.priceInCurrency ?? 0),
        4
      )

      Logger.info(wtf)

      setAmountInCurrency(
        !value.bn.isZero() && selectedToken?.priceInCurrency ? wtf : ''
      )
      onAmountChange && onAmountChange(value)
    },
    [onAmountChange, selectedToken?.priceInCurrency, maxAmountString]
  )

  // When setting to the max, pin the input value to the max value
  useEffect(() => {
    if (!isMaxAmount || !maxAmountString || skipHandleMaxAmount) return
    handleAmountChange({
      amount: maxAmountString,
      bn: numberToBN(maxAmountString, 18)
    })
  }, [maxAmountString, handleAmountChange, isMaxAmount, skipHandleMaxAmount])

  return (
    <View>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Heading3>{label ?? 'Token'}</AvaText.Heading3>
        <AvaText.Body2>
          {selectedToken &&
            selectedToken?.balanceDisplayValue &&
            `Balance ${selectedToken.balanceDisplayValue} ${selectedToken.symbol}`}
        </AvaText.Body2>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaButton.Base
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1
          }}
          onPress={openTokenSelectorBottomSheet}>
          {selectedToken ? (
            <>
              <Avatar.Custom
                name={selectedToken.name}
                symbol={selectedToken.symbol}
                logoUri={selectedToken.logoUri}
              />
              <Space x={8} />
              <AvaText.Heading3>{selectedToken.symbol}</AvaText.Heading3>
            </>
          ) : (
            <AvaText.Heading3>Select</AvaText.Heading3>
          )}
          <Space x={8} />
          <CarrotSVG direction={'down'} size={12} color={theme.colorText1} />
        </AvaButton.Base>
        {hideInput || (
          <View>
            <BNInput
              value={
                isMaxAmount && !skipHandleMaxAmount
                  ? maxAmount ?? inputAmount
                  : inputAmount
              }
              max={
                !isValueLoading && !skipHandleMaxAmount
                  ? maxAmount ?? selectedToken?.balance
                  : undefined
              }
              denomination={selectedToken?.decimals || 9}
              placeholder={'0.0'}
              onChange={handleAmountChange}
              onError={errorMessage => {
                onError ? onError(errorMessage) : setBnError(errorMessage)
              }}
              hideErrorMessage={hideErrorMessage}
              isValueLoading={isValueLoading}
              style={{ width: 180 }}
            />
            {!selectedToken && (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => openTokenSelectorBottomSheet()}
              />
            )}
          </View>
        )}
      </Row>
      <Space y={8} />
      <Row>
        {hasError && (
          <AvaText.Body3 color={theme.colorError}>
            {error || bnError}
          </AvaText.Body3>
        )}
        <FlexSpacer />
        <AvaText.Body2>
          {selectedToken ? `${amountInCurrency} ${currency}` : '$0.00 USD'}
        </AvaText.Body2>
      </Row>
    </View>
  )
}

export default UniversalTokenSelector
