import { Row } from 'components/Row'
import { Space } from 'components/Space'
import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { Network } from '@avalabs/core-chains-sdk'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import {
  alpha,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-mobile'
import { NetworkFees } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { isAvmNetwork, isPvmNetwork } from 'utils/network/isAvalancheNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { formatCurrency } from 'utils/FormatCurrency'
import { SubTextNumber } from './SubTextNumber'

export enum FeePreset {
  SLOW = 'Slow',
  NORMAL = 'Normal',
  FAST = 'Fast',
  CUSTOM = 'Custom'
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>['navigation']

const NetworkFeeSelector = ({
  chainId,
  gasLimit,
  onFeesChange,
  isDark = false,
  isGasLimitEditable = true,
  noGasLimitError,
  supportsAvalancheDynamicFee = false
}: {
  chainId?: number
  gasLimit: number
  onFeesChange?(fees: Eip1559Fees, feePreset: FeePreset): void
  isDark?: boolean
  isGasLimitEditable?: boolean
  noGasLimitError?: string
  supportsAvalancheDynamicFee?: boolean
}): JSX.Element => {
  const { activeNetwork, getNetwork } = useNetworks()
  const { networkToken } = activeNetwork
  const { navigate } = useNavigation<NavigationProp>()
  const requestedNetwork = getNetwork(chainId)
  const network = chainId ? requestedNetwork : activeNetwork
  const { data: networkFee } = useNetworkFee(network)

  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    network,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const isPVM = isPvmNetwork(network)
  const isAVM = isAvmNetwork(network)
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.SLOW)
  const [calculatedFees, setCalculatedFees] = useState<GasAndFees>()
  const calculatedMaxTotalFeeDisplayed = useMemo(() => {
    if (!calculatedFees?.maxTotalFee) return
    const unit = new TokenUnit(
      calculatedFees.maxTotalFee,
      networkToken.decimals,
      networkToken.symbol
    )
    return unit.toDisplay({ asNumber: true })
  }, [calculatedFees, networkToken])
  const [customFees, setCustomFees] = useState<GasAndFees>()

  const getInitialFees = useCallback(
    (fee: NetworkFees, preset: FeePreset): GasAndFees => {
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
        gasLimit:
          (isPVM && !supportsAvalancheDynamicFee) || isAVM
            ? GAS_LIMIT_FOR_XP_CHAIN
            : gasLimit,
        networkToken
      })
    },
    [
      nativeTokenPrice,
      isPVM,
      supportsAvalancheDynamicFee,
      isAVM,
      gasLimit,
      networkToken
    ]
  )

  useEffect(() => {
    if (networkFee && gasLimit > 0) {
      // getting both slow and normal (default custom fees) fees
      const slowFees = getInitialFees(networkFee, FeePreset.SLOW)
      setCalculatedFees(slowFees)
      onFeesChange?.(slowFees, FeePreset.SLOW)

      const normalFees = getInitialFees(networkFee, FeePreset.NORMAL)
      setCustomFees(normalFees)
    }
  }, [gasLimit, getInitialFees, networkFee, onFeesChange])

  function handleSelectedPreset(preset: FeePreset): void {
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
        gasLimit,
        networkToken
      })
    }
    setCalculatedFees(newFees)
    newFees && onFeesChange?.(newFees, preset)
  }

  function handleSetCustomFees(fees: Eip1559Fees): void {
    setSelectedPreset(FeePreset.CUSTOM)

    const newFees = calculateGasAndFees({
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      tokenPrice: nativeTokenPrice,
      gasLimit: fees.gasLimit,
      networkToken
    })
    setCustomFees(newFees)
    setCalculatedFees(newFees)
    onFeesChange?.(newFees, FeePreset.CUSTOM)
  }

  const goToEditGasLimit = (n?: Network): void => {
    if (networkFee === undefined || n === undefined) return
    navigate(AppNavigation.Modal.EditGasLimit, {
      network: n,
      onSave: handleSetCustomFees,
      lowMaxFeePerGas: networkFee.low.maxFeePerGas,
      maxFeePerGas: customFees?.maxFeePerGas ?? networkFee.medium.maxFeePerGas,
      maxPriorityFeePerGas:
        customFees?.maxPriorityFeePerGas ??
        networkFee.medium.maxPriorityFeePerGas ??
        0n,
      gasLimit: customFees?.gasLimit ?? gasLimit,
      isGasLimitEditable,
      feeDecimals: networkFee.displayDecimals,
      noGasLimitError
    })
  }

  return (
    <>
      <Space y={4} />
      <View
        sx={{
          backgroundColor: isDark ? '$neutral900' : '$neutral800',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}>
        {!networkFee?.isFixedFee && (
          <>
            <Row
              style={{
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <FeeSelector
                label={FeePreset.SLOW}
                selected={selectedPreset === FeePreset.SLOW}
                onSelect={() => handleSelectedPreset(FeePreset.SLOW)}
                testID="slow_base_fee"
              />
              <FeeSelector
                label={FeePreset.NORMAL}
                selected={selectedPreset === FeePreset.NORMAL}
                onSelect={() => handleSelectedPreset(FeePreset.NORMAL)}
                testID="fast_base_fee"
              />
              <FeeSelector
                label={FeePreset.FAST}
                selected={selectedPreset === FeePreset.FAST}
                onSelect={() => handleSelectedPreset(FeePreset.FAST)}
                testID="instant_base_fee"
              />
              <FeeSelector
                label={FeePreset.CUSTOM}
                selected={selectedPreset === FeePreset.CUSTOM}
                onSelect={() => {
                  handleSelectedPreset(FeePreset.CUSTOM)
                  goToEditGasLimit(network)
                }}
                testID="custom_base_fee"
              />
            </Row>
            <Space y={20} />
          </>
        )}
        <>
          <Row
            style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" sx={{ color: '$neutral400' }}>
              Fee Amount
            </Text>
            <View sx={{ flexDirection: 'row' }}>
              <SubTextNumber
                number={calculatedMaxTotalFeeDisplayed}
                testID="token_gas_fee"
              />
              <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
                {' ' + network?.networkToken?.symbol}
              </Text>
            </View>
          </Row>
          <Row style={{ justifyContent: 'flex-end' }}>
            <Text
              variant="caption"
              sx={{ color: '$neutral400', lineHeight: 15 }}>
              {calculatedFees?.maxTotalFeeInCurrency
                ? formatCurrency({
                    amount: calculatedFees.maxTotalFeeInCurrency,
                    currency: selectedCurrency,
                    boostSmallNumberPrecision: false,
                    showLessThanThreshold: true
                  })
                : UNKNOWN_AMOUNT + ' ' + selectedCurrency}
            </Text>
          </Row>
        </>
      </View>
    </>
  )
}

export const FeeSelector: FC<{
  label: string
  selected: boolean
  testID?: string
  onSelect: (value: string) => void
}> = ({ label, selected, onSelect, testID }) => {
  const {
    theme: { colors }
  } = useTheme()

  const handleSelect = (): void => {
    onSelect(label)
  }

  return (
    <TouchableOpacity
      sx={{
        paddingLeft: 0,
        paddingHorizontal: 0,
        width: 75,
        height: 48,
        borderRadius: 8,
        backgroundColor: selected
          ? colors.$white
          : alpha(colors.$neutral700, 0.5),
        justifyContent: 'center'
      }}
      onPress={handleSelect}>
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center'
        }}>
        <ButtonText selected={selected} testID={testID}>
          {label}
        </ButtonText>
      </View>
    </TouchableOpacity>
  )
}

const ButtonText: FC<
  { selected: boolean; testID?: string } & PropsWithChildren
> = ({ children, selected, testID }) => {
  return (
    <Text
      testID={testID}
      variant="buttonSmall"
      numberOfLines={1}
      sx={{
        color: selected ? '$neutral900' : '$neutral50',
        fontSize: selected ? 14 : 12
      }}>
      {children}
    </Text>
  )
}

export default NetworkFeeSelector
