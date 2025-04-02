import { formatUnits, parseUnits } from 'ethers'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import { Network } from '@avalabs/core-chains-sdk'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import {
  Button,
  DividerLine,
  ScrollView,
  Text,
  View,
  alpha,
  useTheme
} from '@avalabs/k2-mobile'
import { Tooltip } from 'components/Tooltip'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { sanitizeDecimalInput } from 'utils/units/sanitize'
import { formatCurrency } from 'utils/FormatCurrency'
import { SubTextNumber } from './SubTextNumber'

type EditFeesProps = {
  network: Network
  onSave: (customFees: Eip1559Fees) => void
  onClose?: () => void
  lowMaxFeePerGas: bigint
  isGasLimitEditable?: boolean
  feeDecimals?: number
  noGasLimitError?: string
} & Eip1559Fees

const maxBaseFeeInfoMessage =
  'The Base Fee is set by the network and changes frequently. Any difference between the set Base Fee and the actual Base Fee will be refunded.'
const maxPriorityFeeInfoMessage =
  'The Priority Fee is an incentive paid to network operators to prioritize processing a transaction.'
const gasLimitInfoMessage =
  'Total units of gas needed to complete the transaction. Do not edit unless necessary.'

const EditFees = ({
  lowMaxFeePerGas,
  maxFeePerGas: initMaxFeePerGas,
  maxPriorityFeePerGas: initMaxPriorityFeePerGas,
  gasLimit: initGasLimit,
  network,
  onSave,
  onClose,
  isGasLimitEditable,
  feeDecimals,
  noGasLimitError
}: EditFeesProps): JSX.Element => {
  const isBaseUnitRate = feeDecimals === undefined
  const _gasLimitError = noGasLimitError ?? 'Please enter a valid gas limit'
  const {
    theme: { colors }
  } = useTheme()
  const selectedCurrency = useSelector(
    selectSelectedCurrency
  ).toLowerCase() as VsCurrencyType

  const [newGasLimit, setNewGasLimit] = useState<string>(
    initGasLimit.toString()
  )

  /**
   * Denominated depending of network:
   * BTC - Satoshi
   * AVAX - nAVAX
   * EVM - gWei
   */
  const [newMaxFeePerGas, setNewMaxFeePerGas] = useState<string>(
    isBaseUnitRate
      ? initMaxFeePerGas.toString()
      : formatUnits(initMaxFeePerGas, feeDecimals)
  )
  /**
   * Denominated depending of network:
   * BTC - Satoshi
   * AVAX - nAVAX
   * EVM - gWei
   */
  const [newMaxPriorityFeePerGas, setNewMaxPriorityFeePerGas] =
    useState<string>(
      isBaseUnitRate
        ? initMaxPriorityFeePerGas.toString()
        : formatUnits(initMaxPriorityFeePerGas, feeDecimals)
    )
  const tokenPrice = useNativeTokenPriceForNetwork(network).nativeTokenPrice
  const [feeError, setFeeError] = useState('')
  const [gasLimitError, setGasLimitError] = useState('')
  const [newFees, setNewFees] = useState<GasAndFees>(
    calculateGasAndFees({
      maxFeePerGas: initMaxFeePerGas,
      maxPriorityFeePerGas: initMaxPriorityFeePerGas,
      tokenPrice,
      gasLimit: initGasLimit,
      networkToken: network.networkToken
    })
  )
  const maxTotalFee = useMemo(
    () =>
      new TokenUnit(
        newFees.maxTotalFee,
        network.networkToken.decimals,
        network.networkToken.symbol
      ).toDisplay({ asNumber: true }),
    [
      network.networkToken.decimals,
      network.networkToken.symbol,
      newFees.maxTotalFee
    ]
  )

  useEffect(() => {
    try {
      if (!newMaxFeePerGas) return

      const fees = calculateGasAndFees({
        tokenPrice,
        maxFeePerGas: isBaseUnitRate
          ? BigInt(newMaxFeePerGas)
          : parseUnits(newMaxFeePerGas, feeDecimals),
        maxPriorityFeePerGas: isBaseUnitRate
          ? BigInt(newMaxPriorityFeePerGas)
          : parseUnits(newMaxPriorityFeePerGas, feeDecimals),
        gasLimit: isNaN(parseInt(newGasLimit)) ? 0 : parseInt(newGasLimit),
        networkToken: network.networkToken
      })

      setNewFees(fees)
      setGasLimitError(fees.gasLimit <= 0 ? _gasLimitError : '')
      setFeeError(
        fees.maxFeePerGas < lowMaxFeePerGas
          ? `${isBaseUnitRate ? 'Network' : 'Max base'} fee is too low`
          : ''
      )
    } catch (e) {
      setFeeError('Gas Limit is too much')
    }
  }, [
    isBaseUnitRate,
    feeError,
    initMaxFeePerGas,
    gasLimitError,
    newGasLimit,
    newMaxFeePerGas,
    newMaxPriorityFeePerGas,
    tokenPrice,
    lowMaxFeePerGas,
    _gasLimitError,
    feeDecimals,
    network.networkToken
  ])

  const handleOnSave = (): void => {
    if (newGasLimit) {
      onSave({
        gasLimit: Number(newGasLimit),
        maxFeePerGas: newFees.maxFeePerGas,
        maxPriorityFeePerGas: newFees.maxPriorityFeePerGas
      })
      onClose?.()
    }
  }

  const saveDisabled = !!feeError || newFees.gasLimit === 0 || !newMaxFeePerGas

  const handleDecimalInputTextChange = useCallback(
    (
      text: string,
      setter: (value: React.SetStateAction<string>) => void
    ): void => {
      const sanitized = sanitizeDecimalInput({
        text,
        maxDecimals: feeDecimals,
        allowDecimalPoint: !isBaseUnitRate
      })
      setter(sanitized)
    },
    [feeDecimals, isBaseUnitRate]
  )

  const handleGasLimitChange = useCallback((text: string) => {
    // allow only whole numbers (no decimals)
    const sanitized = text.replace(/[^0-9]/g, '')
    setNewGasLimit(sanitized)
  }, [])

  return (
    <SafeAreaProvider style={{ flex: 1, paddingBottom: 16 }}>
      <ScrollView>
        <Text
          variant="heading4"
          sx={{ color: '$neutral50', marginHorizontal: 12 }}>
          Edit Network Fee
        </Text>
        <Space y={24} />
        <InputText
          label={isBaseUnitRate ? 'Network Fee' : 'Max Base Fee'}
          testID="custom_network_fee_input"
          mode={'amount'}
          text={newMaxFeePerGas}
          keyboardType="numeric"
          popOverInfoText={isBaseUnitRate ? undefined : maxBaseFeeInfoMessage}
          onChangeText={text =>
            handleDecimalInputTextChange(text, setNewMaxFeePerGas)
          }
          errorText={feeError}
        />
        {!isBaseUnitRate && (
          <>
            <InputText
              label={'Max Priority Fee'}
              mode={'amount'}
              keyboardType="numeric"
              text={newMaxPriorityFeePerGas}
              popOverInfoText={maxPriorityFeeInfoMessage}
              onChangeText={text =>
                handleDecimalInputTextChange(text, setNewMaxPriorityFeePerGas)
              }
            />
            <InputText
              label={'Gas Limit'}
              mode={'amount'}
              text={newGasLimit}
              keyboardType="numeric"
              editable={isGasLimitEditable}
              popOverInfoText={gasLimitInfoMessage}
              onChangeText={handleGasLimitChange}
              errorText={gasLimitError}
              backgroundColor={
                isGasLimitEditable
                  ? alpha(colors.$neutral800, 0.5)
                  : colors.$neutral900
              }
              borderColor={colors.$neutral800}
            />
          </>
        )}
        <View sx={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 16 }}>
          <DividerLine />
        </View>
        <Row style={{ marginHorizontal: 12, alignItems: 'baseline' }}>
          {isBaseUnitRate ? (
            <TotalNetworkFeeText />
          ) : (
            <Tooltip
              style={{ width: 220 }}
              content={`Total Network Fee = (Current Base Fee + Max Priority Fee) * Gas Limit.\n\nIt will never be higher than Max Base Fee * Gas Limit.`}
              position={'bottom'}>
              <TotalNetworkFeeText />
            </Tooltip>
          )}
          <FlexSpacer />
          <SubTextNumber number={maxTotalFee} size="big" />

          <Space x={4} />
          <Text variant="heading6" sx={{ color: '$neutral400' }}>
            {network?.networkToken?.symbol?.toUpperCase()}
          </Text>
        </Row>
        <Text
          variant="body2"
          sx={{
            color: '$neutral300',
            lineHeight: 15,
            alignSelf: 'flex-end',
            marginTop: 2,
            marginRight: 14
          }}>
          {formatCurrency({
            amount: newFees.maxTotalFeeInCurrency,
            currency: selectedCurrency,
            boostSmallNumberPrecision: false,
            showLessThanThreshold: true
          })}
        </Text>
      </ScrollView>
      <Button
        testID="custom_network_fee_save_btn"
        type={'primary'}
        size={'xlarge'}
        disabled={saveDisabled}
        style={{ marginHorizontal: 16 }}
        onPress={handleOnSave}>
        Save
      </Button>
    </SafeAreaProvider>
  )
}

const TotalNetworkFeeText = (): JSX.Element => (
  <Text variant="caption" sx={{ color: '$neutral500' }}>
    Total Network Fee
  </Text>
)

export default EditFees
