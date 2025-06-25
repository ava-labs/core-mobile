import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { NetworkFees } from '@avalabs/vm-module-types'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { NetworkWithCaip2ChainId } from 'store/network/types'
import { selectSelectedCurrency } from 'store/settings/currency'
import { isAvmNetwork } from 'utils/network/isAvalancheNetwork'
import { sanitizeDecimalInput } from 'utils/units/sanitize'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import {
  DEFAULT_NETWORK_TOKEN_DECIMALS,
  DEFAULT_NETWORK_TOKEN_SYMBOL
} from '../consts'
import { FeePreset } from '../types'

enum FeeType {
  MAX_FEE_PER_GAS = 'maxFeePerGas',
  MAX_PRIORITY_FEE = 'maxPriorityFeePerGas',
  GAS_LIMIT = 'gasLimit'
}

export const useNetworkFeeSelector = ({
  chainId,
  gasLimit,
  onFeesChange
}: {
  chainId: number
  gasLimit: number
  onFeesChange: (fees: Eip1559Fees, preset: FeePreset) => void
}): {
  selectedCurrency: string
  network: NetworkWithCaip2ChainId | undefined
  calculatedFees: GasAndFees | undefined
  calculatedMaxTotalFeeDisplayed: number | undefined
  feeDecimals: number | undefined
  customFees: GasAndFees | undefined
  handleSetCustomFees: (fees: Eip1559Fees) => void
  showFeeEditAlert: (options: {
    key: FeeType
    title: string
    initialValue: string
    onSave: (values: Record<string, string>) => void
  }) => void
  selectedPreset: FeePreset
  handleSelectedPreset: (preset: FeePreset) => void
  isBaseUnitRate: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const { getNetwork } = useNetworks()
  const network = getNetwork(chainId)
  const networkTokenSymbol =
    network?.networkToken?.symbol ?? DEFAULT_NETWORK_TOKEN_SYMBOL
  const networkTokenDecimals =
    network?.networkToken?.decimals ?? DEFAULT_NETWORK_TOKEN_DECIMALS

  const { data: networkFee } = useNetworkFee(network)
  const feeDecimals = networkFee?.displayDecimals
  const isBaseUnitRate = feeDecimals === undefined

  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    network,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const isAvalancheCChain = network
    ? isAvalancheCChainId(network.chainId)
    : false

  const initialPreset = isAvalancheCChain ? FeePreset.INSTANT : FeePreset.NORMAL
  const [selectedPreset, setSelectedPreset] = useState(initialPreset)
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
        preset === FeePreset.NORMAL
          ? 'low'
          : preset === FeePreset.FAST
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
    // if user is editing custom fees, don't update calculated fees or custom fees
    if (selectedPreset === FeePreset.CUSTOM) return

    // update calculated fees and custom fees whenever network fee changes
    if (networkFee && gasLimit > 0) {
      const updatedFees = getFeesForPreset(networkFee, selectedPreset)
      setCalculatedFees(updatedFees)
      updatedFees && onFeesChange(updatedFees, selectedPreset)

      const normalFees = getFeesForPreset(
        networkFee,
        isAvalancheCChain ? FeePreset.INSTANT : FeePreset.FAST
      )
      normalFees && setCustomFees(normalFees)
    }
  }, [
    gasLimit,
    getFeesForPreset,
    networkFee,
    onFeesChange,
    selectedPreset,
    isAvalancheCChain
  ])

  const handleSelectedPreset = useCallback(
    (preset: FeePreset): void => {
      setSelectedPreset(preset)

      let newFees

      if (preset === FeePreset.CUSTOM) {
        newFees = customFees
      } else {
        if (!networkFee) return

        const feeRateMap = {
          [FeePreset.NORMAL]: networkFee.low,
          [FeePreset.FAST]: networkFee.medium,
          [FeePreset.INSTANT]: networkFee.high
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

  const sanitize = useCallback(
    ({ text, key }: { text: string; key: string }): string => {
      if (key === FeeType.GAS_LIMIT) {
        // allow only whole numbers (no decimals) for gas limit
        return text.replace(/[^0-9]/g, '')
      } else {
        return sanitizeDecimalInput({
          text,
          maxDecimals: feeDecimals,
          allowDecimalPoint: !isBaseUnitRate
        })
      }
    },
    [feeDecimals, isBaseUnitRate]
  )

  const showFeeEditAlert = useCallback(
    ({
      key,
      title,
      initialValue,
      onSave
    }: {
      key: FeeType
      title: string
      initialValue: string
      onSave: (values: Record<string, string>) => void
    }): void => {
      showAlertWithTextInput({
        title: title,
        inputs: [
          {
            key,
            defaultValue: initialValue,
            keyboardType: 'numeric',
            sanitize
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            onPress: dismissAlertWithTextInput
          },
          {
            text: 'Save',
            shouldDisable: (values: Record<string, string>) => {
              return values[key]?.trim() === ''
            },
            onPress: onSave
          }
        ]
      })
    },
    [sanitize]
  )

  const handleSetCustomFees = useCallback(
    (fees: Eip1559Fees): void => {
      setSelectedPreset(FeePreset.CUSTOM)

      const newFees = calculateGasAndFees({
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n,
        tokenPrice: nativeTokenPrice,
        gasLimit: fees.gasLimit,
        networkTokenDecimals,
        networkTokenSymbol
      })

      setCustomFees(newFees)
      setCalculatedFees(newFees)
      onFeesChange?.(newFees, FeePreset.CUSTOM)
    },
    [onFeesChange, nativeTokenPrice, networkTokenDecimals, networkTokenSymbol]
  )

  return {
    selectedCurrency,
    network,
    calculatedFees,
    calculatedMaxTotalFeeDisplayed,
    feeDecimals,
    customFees,
    handleSetCustomFees,
    showFeeEditAlert,
    selectedPreset,
    handleSelectedPreset,
    isBaseUnitRate
  }
}
