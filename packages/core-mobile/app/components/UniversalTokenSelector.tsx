import React, { FC, useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { TokenWithBalance } from 'store/balance'
import { AssetBalance } from 'screens/bridge/utils/types'
import BN from 'bn.js'
import { bnToBig } from '@avalabs/utils-sdk'
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
import { formatLargeCurrency } from 'utils/Utils'
import { Amount } from 'types'

interface Props {
  selectedToken?: TokenWithBalance
  onTokenChange: (token: TokenWithBalance | AssetBalance) => void
  onMax?: () => void
  hideInput?: boolean
  inputAmount?: BN
  onAmountChange: (amount: Amount) => void
  error?: string
  label?: string
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  hideZeroBalanceTokens?: boolean
  testID?: string
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.SelectToken
>['navigation']

const UniversalTokenSelector: FC<Props> = ({
  selectedToken,
  onTokenChange,
  onMax,
  hideInput,
  inputAmount,
  onAmountChange,
  error,
  label,
  isValueLoading,
  hideErrorMessage,
  hideZeroBalanceTokens = false
}) => {
  const theme = useApplicationContext().theme
  const { currencyFormatter } = useApplicationContext().appHook
  const navigation = useNavigation<NavigationProp>()
  const hasError = !!error

  const openTokenSelectorBottomSheet = (): void => {
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
    return formatLargeCurrency(
      currencyFormatter(bnNumber * selectedToken.priceInCurrency),
      4
    )
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
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Heading3 textStyle={{ marginBottom: 4 }}>
          {label ?? 'Token'}
        </AvaText.Heading3>
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
              testID="universal_token_selector__amount_field"
              value={inputAmount}
              onMax={onMax}
              denomination={selectedToken?.decimals || 9}
              placeholder={'0.0'}
              onChange={handleAmountChange}
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
          <AvaText.Body3 color={theme.colorError}>{error}</AvaText.Body3>
        )}
        <FlexSpacer />
        <AvaText.Body2>
          {selectedToken && amountInCurrency ? amountInCurrency : '$0.00 USD'}
        </AvaText.Body2>
      </Row>
    </View>
  )
}

export default UniversalTokenSelector
