import React, { useCallback, useEffect, useMemo, useState } from 'react'
// import { formatUnits } from 'ethers'
import {
  View,
  Text,
  GroupList,
  alpha,
  useTheme,
  //Tooltip,
  GroupListItem
} from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { isAvmNetwork } from 'utils/network/isAvalancheNetwork'
import { NetworkFees } from '@avalabs/vm-module-types'
import { SubTextNumber } from 'new/common/components/SubTextNumber'
import { formatCurrency } from 'utils/FormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { GasOptions, FeePreset } from './GasOptions'

const DEFAULT_NETWORK_TOKEN_SYMBOL = ''
const DEFAULT_NETWORK_TOKEN_DECIMALS = 9
//const DEFAULT_FEE_DECIMALS = 9

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
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const { getNetwork } = useNetworks()
  const network = getNetwork(chainId)
  const networkTokenSymbol =
    network?.networkToken?.symbol ?? DEFAULT_NETWORK_TOKEN_SYMBOL
  const networkTokenDecimals =
    network?.networkToken?.decimals ?? DEFAULT_NETWORK_TOKEN_DECIMALS

  const { data: networkFee } = useNetworkFee(network)
  //const feeDecimals = networkFee?.displayDecimals ?? DEFAULT_FEE_DECIMALS

  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    network,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const [selectedPreset, setSelectedPreset] = useState(FeePreset.SLOW)
  const [calculatedFees, setCalculatedFees] = useState<GasAndFees>()

  const isAVM = isAvmNetwork(network)

  const calculatedMaxTotalFeeDisplayed = useMemo(() => {
    if (!calculatedFees?.maxTotalFee) return
    const unit = new TokenUnit(
      calculatedFees.maxTotalFee,
      networkTokenDecimals,
      networkTokenSymbol
    )
    return unit.toDisplay({ asNumber: true })
  }, [calculatedFees, networkTokenDecimals, networkTokenSymbol])

  const [customFees, setCustomFees] = useState<GasAndFees>()

  const getFeesForPreset = useCallback(
    (fee: NetworkFees, preset: FeePreset): GasAndFees | undefined => {
      const key =
        preset === FeePreset.SLOW
          ? 'low'
          : preset === FeePreset.NORMAL
          ? 'medium'
          : 'high'

      return calculateGasAndFees({
        maxFeePerGas: fee[key].maxFeePerGas,
        maxPriorityFeePerGas: fee[key].maxPriorityFeePerGas ?? 0n,
        tokenPrice: nativeTokenPrice,
        gasLimit: isAVM ? GAS_LIMIT_FOR_X_CHAIN : gasLimit,
        networkTokenDecimals,
        networkTokenSymbol
      })
    },
    [
      networkTokenDecimals,
      networkTokenSymbol,
      nativeTokenPrice,
      isAVM,
      gasLimit
    ]
  )

  useEffect(() => {
    if (networkFee && gasLimit > 0) {
      // getting both slow and normal (default custom fees) fees
      const slowFees = getFeesForPreset(networkFee, FeePreset.SLOW)
      setCalculatedFees(slowFees)
      slowFees && onFeesChange(slowFees, FeePreset.SLOW)

      const normalFees = getFeesForPreset(networkFee, FeePreset.NORMAL)
      normalFees && setCustomFees(normalFees)
    }
  }, [gasLimit, getFeesForPreset, networkFee, onFeesChange])

  const handleSelectedPreset = useCallback(
    (preset: FeePreset): void => {
      setSelectedPreset(preset)

      let newFees

      if (preset === FeePreset.CUSTOM) {
        newFees = customFees
      } else {
        if (!networkFee) return

        const feeRateMap = {
          [FeePreset.SLOW]: networkFee.low,
          [FeePreset.NORMAL]: networkFee.medium,
          [FeePreset.FAST]: networkFee.high
        }

        const presetFeeRate = feeRateMap[preset]

        newFees = calculateGasAndFees({
          maxFeePerGas: presetFeeRate.maxFeePerGas,
          maxPriorityFeePerGas: presetFeeRate.maxPriorityFeePerGas ?? 0n,
          tokenPrice: nativeTokenPrice,
          gasLimit: isAVM ? GAS_LIMIT_FOR_X_CHAIN : gasLimit,
          networkTokenDecimals,
          networkTokenSymbol
        })
      }
      setCalculatedFees(newFees)
      newFees && onFeesChange?.(newFees, preset)
    },
    [
      customFees,
      networkTokenDecimals,
      networkTokenSymbol,
      gasLimit,
      nativeTokenPrice,
      networkFee,
      onFeesChange,
      isAVM
    ]
  )

  // function handleSetCustomFees(fees: Eip1559Fees): void {
  //   setSelectedPreset(FeePreset.CUSTOM)

  //   const newFees = calculateGasAndFees({
  //     maxFeePerGas: fees.maxFeePerGas,
  //     maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  //     tokenPrice: nativeTokenPrice,
  //     gasLimit: fees.gasLimit,
  //     maxDecimals:  ?? DEFAULT_MAX_DECIMALS
  //   })
  //   setCustomFees(newFees)
  //   setCalculatedFees(newFees)
  //   onFeesChange?.(newFees, FeePreset.CUSTOM)
  // }

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
            <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
              {' ' + network?.networkToken?.symbol}
            </Text>
          </View>
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              color: alpha(colors.$textPrimary, 0.6),
              fontSize: 12,
              lineHeight: 15,
              marginLeft: 14
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
        <GasOptions
          selectedPreset={selectedPreset}
          onSelectPreset={handleSelectedPreset}
        />
      )
    })

    // if (calculatedFees?.maxFeePerGas) {
    //   items.push({
    //     title: 'Max base fee',
    //     rightIcon: (
    //       <Tooltip
    //         title="Max base fee"
    //         description="The base fee is set by the network and changes frequently. Any difference between the set base fee and the actual base fee will be refunded."
    //       />
    //     ),
    //     value: (
    //       <Text
    //         variant="body1"
    //         testID="token_amount"
    //         sx={{
    //           color: '$textPrimary',
    //           fontSize: 16,
    //           lineHeight: 16
    //         }}>
    //         {formatUnits(calculatedFees.maxFeePerGas.toString(), feeDecimals)}
    //       </Text>
    //     )
    //   })
    // }

    // if (calculatedFees?.maxPriorityFeePerGas) {
    //   items.push({
    //     title: 'Max priority fee',
    //     rightIcon: (
    //       <Tooltip
    //         title="Max priority fee"
    //         description="The Priority Fee is an incentive paid to network operators to prioritize processing a transaction."
    //       />
    //     ),
    //     value: (
    //       <Text
    //         variant="body1"
    //         testID="token_amount"
    //         sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 16 }}>
    //         {formatUnits(
    //           calculatedFees.maxPriorityFeePerGas.toString(),
    //           feeDecimals
    //         )}
    //       </Text>
    //     )
    //   })
    // }

    // if (calculatedFees?.gasLimit) {
    //   items.push({
    //     title: 'Gas limit',
    //     rightIcon: (
    //       <Tooltip
    //         title="Gas limit"
    //         description="Total units of gas needed to complete the transaction. Do not edit unless necessary."
    //       />
    //     ),
    //     value: String(calculatedFees.gasLimit)
    //   })
    // }

    return items
  }, [
    colors.$textPrimary,
    selectedCurrency,
    calculatedFees,
    calculatedMaxTotalFeeDisplayed,
    network?.networkToken?.symbol,
    handleSelectedPreset,
    selectedPreset
    //feeDecimals
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
    </View>
  )
}
