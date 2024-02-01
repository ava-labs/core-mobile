import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'
import { useSelector } from 'react-redux'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { selectActiveNetwork, selectNetwork } from 'store/network'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { calculateGasAndFees, Eip1559Fees, GasAndFees } from 'utils/Utils'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import { NetworkTokenUnit } from 'types'
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
  maxNetworkFee
}: {
  chainId?: number
  gasLimit: number
  onFeesChange?(fees: Eip1559Fees<NetworkTokenUnit>, feePreset: FeePreset): void
  maxNetworkFee?: NetworkTokenUnit
}): JSX.Element => {
  const { navigate } = useNavigation<NavigationProp>()
  const { theme } = useApplicationContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const requestedNetwork = useSelector(selectNetwork(chainId))
  const network = chainId ? requestedNetwork : activeNetwork
  const { data: networkFee } = useNetworkFee(network)

  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    network,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const isBtcNetwork = Boolean(network?.vmName === NetworkVMType.BITCOIN)
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Instant)
  const [calculatedFees, setCalculatedFees] =
    useState<GasAndFees<NetworkTokenUnit>>()
  const [customFees, setCustomFees] = useState<GasAndFees<NetworkTokenUnit>>()

  // customFees init value.
  // NetworkFee is not immediately available hence the useEffect
  useEffect(() => {
    if (!customFees && networkFee && gasLimit) {
      const initialCustomFees = calculateGasAndFees<NetworkTokenUnit>({
        maxFeePerGas: networkFee.low.maxFeePerGas,
        maxPriorityFeePerGas:
          networkFee.low.maxPriorityFeePerGas ??
          NetworkTokenUnit.fromNetwork(activeNetwork, 0),
        tokenPrice: nativeTokenPrice,
        gasLimit
      })
      setCustomFees(initialCustomFees)
    }
  }, [activeNetwork, customFees, gasLimit, nativeTokenPrice, networkFee])

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
          NetworkTokenUnit.fromNetwork(activeNetwork, 0),
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
    return {
      [FeePreset.Normal]: networkFee.low.maxFeePerGas.toFeeUnit().toString(),
      [FeePreset.Fast]: networkFee.medium.maxFeePerGas.toFeeUnit().toString(),
      [FeePreset.Instant]: networkFee.high.maxFeePerGas.toFeeUnit().toString(),
      [FeePreset.Custom]:
        customFees?.maxFeePerGas.toFeeUnit().toString() ??
        networkFee.low.maxFeePerGas.toFeeUnit().toString()
    }
  }, [customFees?.maxFeePerGas, networkFee])

  function calcRelativeFeeIncrease(value: string): void {
    if (!value) return
    if (!networkFee || !customFees) return
    const zeroNetworkTokenUnit = NetworkTokenUnit.fromNetwork(activeNetwork)
    const customMaxFeePerGas = zeroNetworkTokenUnit.add(value).div(10 ** 9)
    const customFeeRelativeChange = customMaxFeePerGas.sub(
      networkFee.low.maxFeePerGas
    )
    let customPriorityFee =
      networkFee.low.maxPriorityFeePerGas?.add(customFeeRelativeChange) ??
      zeroNetworkTokenUnit
    if (customPriorityFee.lt(0)) {
      customPriorityFee = zeroNetworkTokenUnit
    }
    handleSetCustomFees({
      gasLimit: customFees.gasLimit,
      maxFeePerGas: customMaxFeePerGas,
      maxPriorityFeePerGas: customPriorityFee
    })
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {!isBtcNetwork && (
          <Tooltip
            content={
              'Core estimates the maximum gas (maxFeePerGas) a transaction could consume based on network conditions. This transaction will likely consume less gas than estimated.'
            }
            position={'right'}
            style={{ width: 200 }}>
            <AvaText.Body2>Maximum Network Fee</AvaText.Body2>
          </Tooltip>
        )}
        {network?.vmName === NetworkVMType.EVM && (
          <View>
            <AvaButton.Icon
              onPress={() => {
                if (!networkFee) return
                navigate(AppNavigation.Modal.EditGasLimit, {
                  network,
                  onSave: handleSetCustomFees,
                  maxFeePerGas:
                    customFees?.maxFeePerGas ?? networkFee.low.maxFeePerGas,
                  maxPriorityFeePerGas:
                    customFees?.maxPriorityFeePerGas ??
                    networkFee.low.maxPriorityFeePerGas ??
                    NetworkTokenUnit.fromNetwork(activeNetwork),
                  gasLimit
                })
              }}>
              <SettingsCogSVG />
            </AvaButton.Icon>
          </View>
        )}
      </Row>
      <Space y={4} />

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
        {!networkFee?.isFixedFee && (
          <>
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
              editable
              label={FeePreset.Custom}
              selected={selectedPreset === FeePreset.Custom}
              onSelect={() => handleSelectedPreset(FeePreset.Custom)}
              placeholder={displayGasValues?.[FeePreset.Normal]}
              value={
                selectedPreset !== FeePreset.Custom && !customFees
                  ? displayGasValues?.[FeePreset.Normal]
                  : displayGasValues?.[FeePreset.Custom]
              }
              onValueEntered={calcRelativeFeeIncrease}
            />
          </>
        )}
      </Row>
      <Space y={20} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2>Fee Amount</AvaText.Body2>
        <AvaText.Heading3>
          {calculatedFees?.maxTotalFee.toDisplay(4)}{' '}
          {network?.networkToken?.symbol}
        </AvaText.Heading3>
      </Row>
      <AvaText.Body3
        currency
        color={theme.colorText2}
        textStyle={{ marginTop: 4, alignSelf: 'flex-end' }}>
        {calculatedFees?.maxTotalFeeInCurrency}
      </AvaText.Body3>
      {maxNetworkFee && calculatedFees?.maxTotalFee.gt(maxNetworkFee) && (
        <AvaText.Body3 color={theme.colorError}>
          Insufficient balance to cover gas costs. {'\n'}
          {network?.networkToken?.symbol
            ? `Please add ${network.networkToken.symbol}`
            : ''}
          .
        </AvaText.Body3>
      )}
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
  const { theme } = useApplicationContext()
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
          backgroundColor: theme.colorText1,
          borderWidth: 0,
          fontFamily: 'Inter-SemiBold',
          textAlign: 'center',
          textAlignVertical: 'center',
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          color: theme.colorBg2,
          fontSize: 14,
          lineHeight: 18
        }}
        style={{ margin: 0 }}
        mode={'amount'}
      />
    </ButtonWrapper>
  ) : (
    <AvaButton.Base onPress={handleSelect}>
      <ButtonWrapper selected={selected}>
        <ButtonText selected={selected}>{label}</ButtonText>
        <ButtonText selected={selected}>{value}</ButtonText>
      </ButtonWrapper>
    </AvaButton.Base>
  )
}

const ButtonWrapper: FC<{ selected: boolean }> = ({ children, selected }) => {
  const { theme } = useApplicationContext()
  return (
    <View
      focusable
      style={{
        width: 75,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected
          ? theme.colorText1
          : theme.colorBg3 + Opacity50
      }}>
      {children}
    </View>
  )
}

const ButtonText: FC<{ selected: boolean }> = ({ children, selected }) => {
  const { theme } = useApplicationContext()
  return (
    <AvaText.ButtonMedium
      textStyle={{
        color: selected ? theme.colorBg2 : theme.colorText2,
        fontSize: selected ? 14 : 12,
        lineHeight: 18
      }}>
      {children}
    </AvaText.ButtonMedium>
  )
}

export default NetworkFeeSelector
