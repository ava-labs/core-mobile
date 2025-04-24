import React, { useCallback, useMemo } from 'react'
import { parseUnits } from 'ethers'
import {
  View,
  Text,
  GroupList,
  alpha,
  useTheme,
  GroupListItem,
  AlertWithTextInputs
} from '@avalabs/k2-alpine'
import { Eip1559Fees } from 'utils/Utils'
import { SubTextNumber } from 'new/common/components/SubTextNumber'
import { formatCurrency } from 'utils/FormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useNetworkFeeSelector } from '../../hooks/useNetworkFeeSelector'
import { FeePreset, FeeType } from '../../types'
import { GasOptions } from './GasOptions'
import { CustomFees } from './CustomFees'

export const NetworkFeeSelector = ({
  chainId,
  gasLimit,
  onFeesChange
}: {
  chainId: number
  gasLimit: number
  onFeesChange: (fees: Eip1559Fees, preset: FeePreset) => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    selectedCurrency,
    network,
    calculatedFees,
    calculatedMaxTotalFeeDisplayed,
    feeDecimals,
    customFees,
    handleSetCustomFees,
    alertRef,
    showFeeEditAlert,
    selectedPreset,
    handleSelectedPreset,
    isBaseUnitRate
  } = useNetworkFeeSelector({
    chainId,
    gasLimit,
    onFeesChange
  })

  const valueColor = useMemo(
    () => alpha(colors.$textPrimary, 0.6),
    [colors.$textPrimary]
  )

  const renderCustomFees = useCallback((): JSX.Element => {
    return (
      <CustomFees
        customFees={customFees}
        feeDecimals={feeDecimals}
        onPress={item => {
          showFeeEditAlert({
            key: item.key,
            title: item.title,
            initialValue: item.value,
            onSave: (values: Record<string, string>) => {
              const enteredValue = values[item.key]

              if (!enteredValue) return

              let updatedValue: bigint | number

              if (item.key === FeeType.GAS_LIMIT) {
                updatedValue = parseInt(enteredValue)
              } else {
                updatedValue = isBaseUnitRate
                  ? BigInt(enteredValue)
                  : parseUnits(enteredValue, feeDecimals)
              }
              const currentValues = {
                maxFeePerGas: customFees?.maxFeePerGas ?? 0n,
                maxPriorityFeePerGas: customFees?.maxPriorityFeePerGas ?? 0n,
                gasLimit: customFees?.gasLimit ?? gasLimit
              }

              const newValues = {
                ...currentValues,
                [item.key]: updatedValue
              }

              handleSetCustomFees(newValues)
            }
          })
        }}
      />
    )
  }, [
    isBaseUnitRate,
    customFees,
    feeDecimals,
    gasLimit,
    handleSetCustomFees,
    showFeeEditAlert
  ])

  const data = useMemo(() => {
    const items: GroupListItem[] = []

    items.push({
      title: 'Network fees',
      value: (
        <View
          sx={{
            alignItems: 'flex-end',
            paddingVertical: 12
          }}>
          <View sx={{ flexDirection: 'row' }}>
            <SubTextNumber
              number={calculatedMaxTotalFeeDisplayed}
              testID="token_gas_fee"
            />
            <Text variant="body1" sx={{ color: valueColor, fontSize: 16 }}>
              {' ' + network?.networkToken?.symbol}
            </Text>
          </View>
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              color: valueColor,
              fontSize: 12,
              lineHeight: 15,
              marginLeft: 14,
              marginTop: 2
            }}>
            {calculatedFees?.maxTotalFeeInCurrency
              ? formatCurrency({
                  amount: calculatedFees.maxTotalFeeInCurrency,
                  currency: selectedCurrency,
                  boostSmallNumberPrecision: false,
                  showLessThanThreshold: true
                })
              : UNKNOWN_AMOUNT + ' ' + selectedCurrency}
          </Text>
        </View>
      ),
      accordion: (
        <View>
          <GasOptions
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectedPreset}
          />
          {selectedPreset === FeePreset.CUSTOM && renderCustomFees()}
        </View>
      )
    })

    return items
  }, [
    valueColor,
    selectedCurrency,
    calculatedFees,
    calculatedMaxTotalFeeDisplayed,
    network?.networkToken?.symbol,
    handleSelectedPreset,
    selectedPreset,
    renderCustomFees
  ])

  return (
    <View style={{ width: '100%' }}>
      <GroupList
        data={data}
        titleSx={{
          fontFamily: 'Inter-Regular',
          fontSize: 15,
          lineHeight: 18,
          color: '$textPrimary'
        }}
      />
      <AlertWithTextInputs ref={alertRef} />
    </View>
  )
}
