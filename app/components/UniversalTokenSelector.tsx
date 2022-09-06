import React, { FC, useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { TokenWithBalance } from 'store/balance'
import { AssetBalance } from 'screens/bridge/utils/types'
import BN from 'bn.js'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { bnToBig } from '@avalabs/utils-sdk'
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
import { WalletScreenProps } from 'navigation/types'

interface Props {
  selectedToken?: TokenWithBalance
  onTokenChange: (token: TokenWithBalance | AssetBalance) => void
  hideInput?: boolean
  maxAmount?: BN
  inputAmount?: BN
  onAmountChange: (amount: { amount: string; bn: BN }) => void
  error?: string
  label?: string
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  hideMax?: boolean
  hideZeroBalanceTokens?: boolean
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.SelectToken
>['navigation']

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
  hideMax,
  hideZeroBalanceTokens = false
}) => {
  const theme = useApplicationContext().theme
  const currency = useSelector(selectSelectedCurrency)
  const [bnError, setBnError] = useState('')
  const { currencyFormatter } = useApplicationContext().appHook
  const navigation = useNavigation<NavigationProp>()
  const hasError = !!error || !!bnError

  const openTokenSelectorBottomSheet = () => {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      hideZeroBalance: hideZeroBalanceTokens,
      onTokenSelected: onTokenChange
    })
  }

  const amountInCurrency = useMemo(() => {
    if (!inputAmount || !selectedToken?.decimals) {
      return ''
    }
    const bnNumber = bnToBig(inputAmount, selectedToken?.decimals).toNumber()
    return currencyFormatter(bnNumber * selectedToken.priceInCurrency, 4)
  }, [
    currencyFormatter,
    inputAmount,
    selectedToken?.decimals,
    selectedToken?.priceInCurrency
  ])

  const handleAmountChange = useCallback(
    (value: Amount) => {
      onAmountChange && onAmountChange(value)
    },
    [onAmountChange]
  )

  return (
    <View style={{ marginHorizontal: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Heading3>{label ?? 'Token'}</AvaText.Heading3>
        <AvaText.Body2>
          {selectedToken &&
            selectedToken?.balanceDisplayValue &&
            `Balance ${selectedToken.balanceDisplayValue} ${selectedToken.symbol}`}
        </AvaText.Body2>
      </Row>
      <Row
        style={{
          justifyContent: 'space-between',
          backgroundColor: theme.colorBg2,
          borderRadius: 8
        }}>
        <AvaButton.Base
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingStart: 16,
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
              <AvaText.Heading2>{selectedToken.symbol}</AvaText.Heading2>
            </>
          ) : (
            <AvaText.Heading2>Select</AvaText.Heading2>
          )}
          <Space x={8} />
          <CarrotSVG direction={'down'} size={12} color={theme.colorText1} />
        </AvaButton.Base>
        {hideInput || (
          <View>
            <BNInput
              value={inputAmount}
              max={
                !isValueLoading && !hideMax
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
              style={{
                width: 180,
                backgroundColor: theme.colorBg3,
                borderRadius: 8
              }}
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
          {selectedToken && amountInCurrency
            ? `${amountInCurrency} ${currency}`
            : '$0.00 USD'}
        </AvaText.Body2>
      </Row>
    </View>
  )
}

export default UniversalTokenSelector
