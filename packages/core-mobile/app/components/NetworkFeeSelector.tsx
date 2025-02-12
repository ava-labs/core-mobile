import { Row } from 'components/Row'
import Settings from 'assets/icons/settings.svg'
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
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NetworkFees } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { isAvmNetwork, isPvmNetwork } from 'utils/network/isAvalancheNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { bigIntToFeeDenomination } from 'utils/units/fees'
import { Tooltip } from './Tooltip'

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
  isGasLimitEditable = true,
  noGasLimitError,
  supportsAvalancheDynamicFee = false,
  showOnlyFeeSelection = false
}: {
  chainId?: number
  gasLimit: number
  onFeesChange?(fees: Eip1559Fees, feePreset: FeePreset): void
  isGasLimitEditable?: boolean
  noGasLimitError?: string
  supportsAvalancheDynamicFee?: boolean
  showOnlyFeeSelection?: boolean
}): JSX.Element => {
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
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
  const isBtcNetwork = network ? isBitcoinNetwork(network) : false
  const isPVM = isPvmNetwork(network)
  const isAVM = isAvmNetwork(network)
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.SLOW)
  const [calculatedFees, setCalculatedFees] = useState<GasAndFees>()
  const calculatedMaxTotalFeeDisplayed = useMemo(() => {
    if (!calculatedFees?.maxTotalFee) return UNKNOWN_AMOUNT
    const unit = new TokenUnit(
      calculatedFees.maxTotalFee,
      networkToken.decimals,
      networkToken.symbol
    )
    return unit.toDisplay()
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

  const displayGasValues = useMemo(() => {
    if (!networkFee) return undefined

    const customFee = customFees?.maxFeePerGas ?? networkFee.medium.maxFeePerGas

    return {
      [FeePreset.SLOW]: bigIntToFeeDenomination(
        networkFee.low.maxFeePerGas,
        networkFee.displayDecimals
      ),
      [FeePreset.NORMAL]: bigIntToFeeDenomination(
        networkFee.medium.maxFeePerGas,
        networkFee.displayDecimals
      ),

      [FeePreset.FAST]: bigIntToFeeDenomination(
        networkFee.high.maxFeePerGas,
        networkFee.displayDecimals
      ),
      [FeePreset.CUSTOM]: bigIntToFeeDenomination(
        customFee,
        networkFee.displayDecimals
      )
    }
  }, [customFees?.maxFeePerGas, networkFee])

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
      {!showOnlyFeeSelection && (
        <>
          <Row
            style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            {isBtcNetwork || isPVM || isAVM ? (
              <View sx={{ paddingVertical: 12 }}>
                <Text variant="body2" sx={{ color: '$neutral50' }}>
                  Network Fee
                </Text>
              </View>
            ) : (
              <Tooltip
                content={
                  'Core estimates the maximum gas (maxFeePerGas) a transaction could consume based on network conditions. This transaction will likely consume less gas than estimated.'
                }
                position={'right'}
                style={{ width: 200 }}>
                <Text variant="buttonMedium">Maximum Network Fee</Text>
              </Tooltip>
            )}
            {(!isPVM && supportsAvalancheDynamicFee) ||
              (!isAVM && (
                <TouchableOpacity
                  sx={{ marginTop: 8 }}
                  onPress={() => goToEditGasLimit(network)}>
                  <Settings />
                </TouchableOpacity>
              ))}
          </Row>
        </>
      )}
      <Space y={4} />

      <View
        sx={{
          backgroundColor: '$neutral900',
          padding: 16,
          borderRadius: 8,
          marginBottom: showOnlyFeeSelection ? 0 : 16
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
                value={displayGasValues?.[FeePreset.SLOW]}
                testID="slow_base_fee"
              />
              <FeeSelector
                label={FeePreset.NORMAL}
                selected={selectedPreset === FeePreset.NORMAL}
                onSelect={() => handleSelectedPreset(FeePreset.NORMAL)}
                value={displayGasValues?.[FeePreset.NORMAL]}
                testID="fast_base_fee"
              />
              <FeeSelector
                label={FeePreset.FAST}
                selected={selectedPreset === FeePreset.FAST}
                onSelect={() => handleSelectedPreset(FeePreset.FAST)}
                value={displayGasValues?.[FeePreset.FAST]}
                testID="instant_base_fee"
              />
              <FeeSelector
                label={FeePreset.CUSTOM}
                selected={selectedPreset === FeePreset.CUSTOM}
                onSelect={() => {
                  handleSelectedPreset(FeePreset.CUSTOM)
                  goToEditGasLimit(network)
                }}
                value={
                  selectedPreset !== FeePreset.CUSTOM && !customFees
                    ? displayGasValues?.[FeePreset.NORMAL]
                    : displayGasValues?.[FeePreset.CUSTOM]
                }
                testID="custom_base_fee"
              />
            </Row>
            {!showOnlyFeeSelection && <Space y={20} />}
          </>
        )}
        {!showOnlyFeeSelection && (
          <>
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="body2" sx={{ color: '$neutral400' }}>
                Fee Amount
              </Text>
              <View sx={{ flexDirection: 'row' }}>
                <Text testID="token_gas_fee" sx={{ color: '$neutral50' }}>
                  {`${calculatedMaxTotalFeeDisplayed} `}
                </Text>
                <Text variant="body1" sx={{ color: '$neutral400' }}>
                  {network?.networkToken?.symbol}
                </Text>
              </View>
            </Row>
            <Row style={{ justifyContent: 'flex-end' }}>
              <Text
                variant="caption"
                sx={{ color: '$neutral400', lineHeight: 15 }}>
                {calculatedFees?.maxTotalFeeInCurrency
                  ? tokenInCurrencyFormatter(
                      calculatedFees.maxTotalFeeInCurrency
                    )
                  : UNKNOWN_AMOUNT + ' ' + selectedCurrency}
              </Text>
            </Row>
          </>
        )}
      </View>
    </>
  )
}

export const FeeSelector: FC<{
  label: string
  value?: string
  selected: boolean
  testID?: string
  onSelect: (value: string) => void
}> = ({ label, selected, onSelect, value, testID }) => {
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
        <ButtonText selected={selected}>{label}</ButtonText>
        <ButtonText selected={selected} testID={testID}>
          {value}
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
