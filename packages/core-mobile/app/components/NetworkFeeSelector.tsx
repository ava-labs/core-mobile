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
import { Network } from '@avalabs/chains-sdk'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { NetworkTokenUnit } from 'types'
import { alpha, Button, Text, useTheme, View } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NetworkFee } from 'services/networkFee/types'
import { useBridgeSDK } from '@avalabs/bridge-sdk'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { isPvmNetwork } from 'utils/network/isPvmNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Tooltip } from './Tooltip'
import InputText from './InputText'

export enum FeePreset {
  Normal = 'Normal',
  Fast = 'Fast',
  Instant = 'Instant',
  Custom = 'Custom'
}

export enum FeePresetNetworkFeeMap {
  Normal = 'low',
  Fast = 'medium',
  Instant = 'high'
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>['navigation']

const NetworkFeeSelector = ({
  chainId,
  gasLimit,
  onFeesChange,
  maxNetworkFee,
  isGasLimitEditable = true,
  noGasLimitError
}: {
  chainId?: number
  gasLimit: number
  onFeesChange?(fees: Eip1559Fees<NetworkTokenUnit>, feePreset: FeePreset): void
  maxNetworkFee?: NetworkTokenUnit
  isGasLimitEditable?: boolean
  noGasLimitError?: string
}): JSX.Element => {
  const {
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { activeNetwork, getNetwork } = useNetworks()
  const { navigate } = useNavigation<NavigationProp>()
  const requestedNetwork = getNetwork(chainId)
  const network = chainId ? requestedNetwork : activeNetwork
  const { data: networkFee } = useNetworkFee(network)
  const { currentBlockchain } = useBridgeSDK()
  const [prevBlockChain, setPrevBlockchain] = useState(currentBlockchain)

  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    network,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const isBtcNetwork = network ? isBitcoinNetwork(network) : false
  const isPVM = isPvmNetwork(network)
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Normal)
  const [calculatedFees, setCalculatedFees] =
    useState<GasAndFees<NetworkTokenUnit>>()
  const [customFees, setCustomFees] = useState<GasAndFees<NetworkTokenUnit>>()

  const getInitialCustomFees = useCallback(
    (fee: NetworkFee<NetworkTokenUnit>): GasAndFees<NetworkTokenUnit> => {
      return calculateGasAndFees({
        maxFeePerGas: fee.low.maxFeePerGas,
        maxPriorityFeePerGas:
          fee.low.maxPriorityFeePerGas ??
          NetworkTokenUnit.fromNetwork(activeNetwork),
        tokenPrice: nativeTokenPrice,
        gasLimit: isPVM ? GAS_LIMIT_FOR_XP_CHAIN : gasLimit
      })
    },
    [activeNetwork, gasLimit, isPVM, nativeTokenPrice]
  )

  useEffect(() => {
    if (prevBlockChain !== currentBlockchain) {
      const initialCustomFees = networkFee && getInitialCustomFees(networkFee)
      setCustomFees(initialCustomFees)
      setPrevBlockchain(currentBlockchain)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlockchain, getInitialCustomFees, prevBlockChain])

  // customFees init value.
  // NetworkFee is not immediately available hence the useEffect
  useEffect(() => {
    if (!customFees && networkFee && (gasLimit > 0 || isBtcNetwork || isPVM)) {
      const initialCustomFees = getInitialCustomFees(networkFee)
      setCustomFees(initialCustomFees)
      setCalculatedFees(initialCustomFees)
      onFeesChange?.(initialCustomFees, FeePreset.Normal)
    }
  }, [
    activeNetwork,
    customFees,
    gasLimit,
    getInitialCustomFees,
    isBtcNetwork,
    isPVM,
    nativeTokenPrice,
    networkFee,
    onFeesChange,
    setCustomFees
  ])

  function handleSelectedPreset(preset: FeePreset): void {
    setSelectedPreset(preset)
    let newFees
    if (preset === FeePreset.Custom) {
      newFees = customFees
    } else {
      const presetFeeRate = networkFee?.[FeePresetNetworkFeeMap[preset]]
      if (!presetFeeRate) return
      newFees = calculateGasAndFees<NetworkTokenUnit>({
        maxFeePerGas: presetFeeRate.maxFeePerGas,
        maxPriorityFeePerGas:
          presetFeeRate.maxPriorityFeePerGas ??
          NetworkTokenUnit.fromNetwork(activeNetwork),
        tokenPrice: nativeTokenPrice,
        gasLimit
      })
    }
    setCalculatedFees(newFees)
    newFees && onFeesChange?.(newFees, preset)
  }

  function handleSetCustomFees(fees: Eip1559Fees<NetworkTokenUnit>): void {
    setSelectedPreset(FeePreset.Custom)

    const newFees = calculateGasAndFees<NetworkTokenUnit>({
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      tokenPrice: nativeTokenPrice,
      gasLimit: fees.gasLimit
    })
    setCustomFees(newFees)
    setCalculatedFees(newFees)
    onFeesChange?.(newFees, FeePreset.Custom)
  }

  const displayGasValues = useMemo(() => {
    if (!networkFee) return undefined

    const customFee = isBtcNetwork
      ? customFees?.maxFeePerGas.toSubUnit().toString() ??
        networkFee.low.maxFeePerGas.toSubUnit().toString()
      : customFees?.maxFeePerGas.toFeeUnit() ??
        networkFee.low.maxFeePerGas.toFeeUnit().toString()

    return {
      [FeePreset.Normal]: isBtcNetwork
        ? networkFee.low.maxFeePerGas.toSubUnit().toString()
        : networkFee.low.maxFeePerGas.toFeeUnit(),
      [FeePreset.Fast]: isBtcNetwork
        ? networkFee.medium.maxFeePerGas.toSubUnit().toString()
        : networkFee.medium.maxFeePerGas.toFeeUnit(),
      [FeePreset.Instant]: isBtcNetwork
        ? networkFee.high.maxFeePerGas.toSubUnit().toString()
        : networkFee.high.maxFeePerGas.toFeeUnit(),
      [FeePreset.Custom]: customFee
    }
  }, [customFees?.maxFeePerGas, networkFee, isBtcNetwork])

  const goToEditGasLimit = (n?: Network): void => {
    if (networkFee === undefined || n === undefined) return
    navigate(AppNavigation.Modal.EditGasLimit, {
      network: n,
      onSave: handleSetCustomFees,
      lowMaxFeePerGas: networkFee.low.maxFeePerGas,
      maxFeePerGas: customFees?.maxFeePerGas ?? networkFee.low.maxFeePerGas,
      maxPriorityFeePerGas:
        customFees?.maxPriorityFeePerGas ??
        networkFee.low.maxPriorityFeePerGas ??
        NetworkTokenUnit.fromNetwork(activeNetwork),
      gasLimit,
      isGasLimitEditable,
      isBtcNetwork,
      noGasLimitError
    })
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {isBtcNetwork || isPVM ? (
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
            <Text variant="body2" sx={{ color: '$neutral50' }}>
              Maximum Network Fee
            </Text>
          </Tooltip>
        )}
        {!isPVM && (
          <Button
            size="medium"
            type="tertiary"
            style={{ marginTop: 8 }}
            onPress={() => goToEditGasLimit(network)}>
            <Settings />
          </Button>
        )}
      </Row>
      <Space y={4} />

      <View
        sx={{
          backgroundColor: '$neutral900',
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
                label={isBtcNetwork ? 'Slow' : FeePreset.Normal}
                selected={selectedPreset === FeePreset.Normal}
                onSelect={() => handleSelectedPreset(FeePreset.Normal)}
                value={displayGasValues?.[FeePreset.Normal]}
              />
              <FeeSelector
                label={isBtcNetwork ? 'Medium' : FeePreset.Fast}
                selected={selectedPreset === FeePreset.Fast}
                onSelect={() => handleSelectedPreset(FeePreset.Fast)}
                value={displayGasValues?.[FeePreset.Fast]}
              />
              <FeeSelector
                label={isBtcNetwork ? 'Fast' : FeePreset.Instant}
                selected={selectedPreset === FeePreset.Instant}
                onSelect={() => handleSelectedPreset(FeePreset.Instant)}
                value={displayGasValues?.[FeePreset.Instant]}
              />
              <FeeSelector
                label={FeePreset.Custom}
                selected={selectedPreset === FeePreset.Custom}
                onSelect={() => {
                  handleSelectedPreset(FeePreset.Custom)
                  goToEditGasLimit(network)
                }}
                placeholder={displayGasValues?.[FeePreset.Normal]}
                value={
                  selectedPreset !== FeePreset.Custom && !customFees
                    ? displayGasValues?.[FeePreset.Normal]
                    : displayGasValues?.[FeePreset.Custom]
                }
              />
            </Row>
            <Space y={20} />
          </>
        )}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body2" sx={{ color: '$neutral400' }}>
            Fee Amount
          </Text>
          <View sx={{ flexDirection: 'row' }}>
            <Text sx={{ color: '$neutral50' }}>
              {`${calculatedFees?.maxTotalFee.toDisplay(4) ?? 0} `}
            </Text>
            <Text variant="body1" sx={{ color: '$neutral400' }}>
              {network?.networkToken?.symbol}
            </Text>
          </View>
        </Row>
        <Row style={{ justifyContent: 'flex-end' }}>
          <Text variant="caption" sx={{ color: '$neutral400', lineHeight: 15 }}>
            {currencyFormatter(calculatedFees?.maxTotalFeeInCurrency ?? 0) +
              ' ' +
              selectedCurrency}
          </Text>
        </Row>

        {maxNetworkFee &&
          maxNetworkFee?.gt(0) &&
          calculatedFees?.maxTotalFee.gt(maxNetworkFee) && (
            <Text
              variant="caption"
              sx={{ color: '$dangerMain', lineHeight: 15 }}>
              Insufficient balance to cover gas costs. {'\n'}
              {network?.networkToken?.symbol
                ? `Please add ${network.networkToken.symbol}`
                : ''}
              .
            </Text>
          )}
      </View>
    </>
  )
}

export const FeeSelector: FC<{
  label: string
  value?: string
  selected: boolean
  onSelect: (value: string) => void
  placeholder?: string
  editable?: boolean
  onValueEntered?: (value: string) => void
}> = ({
  label,
  selected,
  onSelect,
  onValueEntered,
  value,
  placeholder,
  editable = false
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    if (editable) {
      if (selected) {
        setShowInput(true)
      } else {
        setShowInput(false)
      }
    }
  }, [editable, selected])

  const handleSelect = (): void => {
    onSelect(label)

    // if you select Custom fee and then dismiss keyboard, you cannot again edit Custom unless you switch to other preset first
    // this if statement fixes that
    if (!showInput && editable && selected) {
      setShowInput(true)
    }
  }

  return showInput ? (
    <ButtonWrapper selected={selected}>
      <ButtonText selected={selected}>{label}</ButtonText>
      <InputText
        text={!value || value === '0' ? '' : value}
        placeholder={placeholder}
        autoFocus
        selectTextOnFocus
        onBlur={() => setShowInput(false)}
        onChangeText={text => onValueEntered?.(text)}
        keyboardType={'numeric'}
        textStyle={{
          backgroundColor: colors.$neutral900,
          borderWidth: 0,
          fontFamily: 'Inter-SemiBold',
          textAlign: 'center',
          textAlignVertical: 'center',
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          color: colors.$white,
          fontSize: 14,
          lineHeight: 18
        }}
        style={{ margin: 0 }}
        mode={'amount'}
      />
    </ButtonWrapper>
  ) : (
    <Button
      type="tertiary"
      size="small"
      style={{
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
        <ButtonText selected={selected}>{value}</ButtonText>
      </View>
    </Button>
  )
}

const ButtonWrapper: FC<{ selected: boolean } & PropsWithChildren> = ({
  children,
  selected
}) => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      focusable
      sx={{
        width: 75,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected
          ? colors.$white
          : alpha(colors.$neutral700, 0.5)
      }}>
      {children}
    </View>
  )
}

const ButtonText: FC<{ selected: boolean } & PropsWithChildren> = ({
  children,
  selected
}) => {
  return (
    <Text
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
