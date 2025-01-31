import React, { FC, useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { AssetBalance } from 'screens/bridge/utils/types'
import { TokenUnit } from '@avalabs/core-utils-sdk'
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
import { Amount } from 'types'
import { Text } from '@avalabs/k2-mobile'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

interface Props {
  selectedToken?: TokenWithBalance
  onTokenChange: (token: TokenWithBalance | AssetBalance) => void
  onMax?: () => void
  hideInput?: boolean
  inputAmount?: bigint
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
  hideZeroBalanceTokens = false,
  testID
}) => {
  const {
    theme,
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()

  const navigation = useNavigation<NavigationProp>()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const hasError = !!error

  const openTokenSelectorBottomSheet = (): void => {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      hideZeroBalance: hideZeroBalanceTokens,
      onTokenSelected: onTokenChange
    })
  }

  const selectedTokenDecimals =
    selectedToken && 'decimals' in selectedToken
      ? selectedToken.decimals
      : undefined

  const amountInCurrency = useMemo(() => {
    if (!inputAmount || !selectedTokenDecimals) {
      return undefined
    }
    const inputInTokenUnit = new TokenUnit(
      inputAmount,
      selectedTokenDecimals,
      selectedToken?.symbol ?? ''
    )
    return selectedToken?.priceInCurrency
      ? inputInTokenUnit
          .mul(selectedToken.priceInCurrency)
          .toDisplay({ fixedDp: 2, asNumber: true })
      : undefined
  }, [inputAmount, selectedToken, selectedTokenDecimals])

  const handleAmountChange = useCallback(
    (value: Amount) => {
      onAmountChange && onAmountChange(value)
    },
    [onAmountChange]
  )

  const getAvailableBalance = useCallback(() => {
    if (selectedToken === undefined) {
      return
    }

    if (
      isTokenWithBalancePVM(selectedToken) ||
      isTokenWithBalanceAVM(selectedToken)
    ) {
      return `Balance ${selectedToken.availableDisplayValue || '0'} ${
        selectedToken.symbol
      }`
    }
    return `Balance ${selectedToken?.balanceDisplayValue || '0'} ${
      selectedToken.symbol
    }`
  }, [selectedToken])

  return (
    <View style={{ marginHorizontal: 16 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Heading3 textStyle={{ marginBottom: 4 }}>
          {label ?? 'Token'}
        </AvaText.Heading3>
        <AvaText.Body2>{getAvailableBalance()}</AvaText.Body2>
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
              <AvaText.Heading2 testID={testID}>
                {selectedToken.symbol}
              </AvaText.Heading2>
            </>
          ) : (
            <AvaText.Heading2 testID={testID}>Select</AvaText.Heading2>
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
              denomination={selectedTokenDecimals || 9}
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
          <Text
            testID="error_msg"
            variant="body2"
            sx={{ color: '$dangerMain', maxWidth: '55%' }}>
            {error}
          </Text>
        )}
        <FlexSpacer />
        <AvaText.Body2
          numberOfLines={1}
          textStyle={{
            maxWidth: hasError ? '32%' : '70%'
          }}
          ellipsizeMode="tail">
          {`${
            selectedToken && amountInCurrency
              ? tokenInCurrencyFormatter(amountInCurrency)
              : '-'
          }`}
        </AvaText.Body2>
        <AvaText.Body2>{' ' + selectedCurrency}</AvaText.Body2>
      </Row>
    </View>
  )
}

export default UniversalTokenSelector
