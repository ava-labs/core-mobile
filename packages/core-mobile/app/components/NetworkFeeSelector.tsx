import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { useSelector } from 'react-redux'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import Big from 'big.js'
import { WalletScreenProps } from 'navigation/types'
import { selectActiveNetwork, selectNetwork } from 'store/network'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { calculateGasAndFees } from 'utils/Utils'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { bigToBigint } from 'utils/bigNumbers/bigToBigint'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import InputText from './InputText'
import { Tooltip } from './Tooltip'

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
  onGasPriceChange,
  onGasLimitChange,
  maxGasPrice
}: {
  chainId?: number
  gasLimit: number
  onGasPriceChange?(gasPrice: bigint, feePreset: FeePreset): void
  onGasLimitChange?(customGasLimit: number): void
  maxGasPrice?: string
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
  const [customGasPrice, setCustomGasPrice] = useState<bigint>()

  // customGasPrice init value.
  // NetworkFee is not immediately available hence the useEffect
  useEffect(() => {
    if (!customGasPrice) {
      setCustomGasPrice(networkFee.low)
    }
  }, [networkFee.low, customGasPrice])

  const selectedGasPrice: bigint = useMemo(() => {
    if (selectedPreset === FeePreset.Custom) {
      return customGasPrice || 0n
    }
    return networkFee[FeePresetNetworkFeeMap[selectedPreset]]
  }, [customGasPrice, networkFee, selectedPreset])

  const newFees = useMemo(
    () =>
      calculateGasAndFees({
        gasPrice: selectedGasPrice,
        tokenPrice: nativeTokenPrice,
        tokenDecimals: network?.networkToken.decimals,
        gasLimit
      }),
    [
      gasLimit,
      nativeTokenPrice,
      network?.networkToken.decimals,
      selectedGasPrice
    ]
  )

  const totalFeeBig = useMemo(() => {
    return bigintToBig(
      (selectedGasPrice || 0n) * BigInt(gasLimit),
      networkFee.nativeTokenDecimals
    )
  }, [gasLimit, networkFee.nativeTokenDecimals, selectedGasPrice])

  useEffect(() => {
    onGasPriceChange?.(selectedGasPrice, selectedPreset)
  }, [selectedGasPrice, selectedPreset, networkFee.low, onGasPriceChange])

  function handleGasLimitChange(newGasLimit: number): void {
    onGasLimitChange?.(newGasLimit)
  }

  const convertFeeToUnit = useCallback(
    (value: bigint) =>
      bigintToBig(value, networkFee.displayDecimals).toFixed(0),
    [networkFee.displayDecimals]
  )

  const displayGasValues = useMemo(() => {
    return {
      [FeePreset.Normal]: convertFeeToUnit(networkFee.low),
      [FeePreset.Fast]: convertFeeToUnit(networkFee.medium),
      [FeePreset.Instant]: convertFeeToUnit(networkFee.high),
      [FeePreset.Custom]: convertFeeToUnit(customGasPrice ?? networkFee.low)
    }
  }, [
    convertFeeToUnit,
    customGasPrice,
    networkFee.high,
    networkFee.low,
    networkFee.medium
  ])

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {!isBtcNetwork && (
          <Tooltip
            content={
              <PoppableGasAndLimit
                gasLimit={gasLimit}
                gasPrice={`${convertFeeToUnit(selectedGasPrice)} ${
                  networkFee.unit
                }`}
              />
            }
            position={'right'}
            style={{ width: 200 }}>
            <AvaText.Body2>Network Fee</AvaText.Body2>
          </Tooltip>
        )}
        {network?.vmName === NetworkVMType.EVM && (
          <View>
            <AvaButton.Icon
              onPress={() => {
                navigate(AppNavigation.Modal.EditGasLimit, {
                  network,
                  gasLimit: gasLimit,
                  gasPrice: customGasPrice ?? networkFee.low,
                  onSave: handleGasLimitChange
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
          onSelect={() => setSelectedPreset(FeePreset.Normal)}
          value={displayGasValues[FeePreset.Normal]}
        />
        {!networkFee?.isFixedFee && (
          <>
            <FeeSelector
              label={isBtcNetwork ? 'Medium' : FeePreset.Fast}
              selected={selectedPreset === FeePreset.Fast}
              onSelect={() => setSelectedPreset(FeePreset.Fast)}
              value={displayGasValues[FeePreset.Fast]}
            />
            <FeeSelector
              label={isBtcNetwork ? 'Fast' : FeePreset.Instant}
              selected={selectedPreset === FeePreset.Instant}
              onSelect={() => setSelectedPreset(FeePreset.Instant)}
              value={displayGasValues[FeePreset.Instant]}
            />
            <FeeSelector
              editable
              label={FeePreset.Custom}
              selected={selectedPreset === FeePreset.Custom}
              onSelect={() => setSelectedPreset(FeePreset.Custom)}
              placeholder={displayGasValues[FeePreset.Normal]}
              value={
                selectedPreset !== FeePreset.Custom &&
                (!customGasPrice || customGasPrice === 0n)
                  ? displayGasValues[FeePreset.Normal]
                  : displayGasValues[FeePreset.Custom]
              }
              onValueEntered={value =>
                setCustomGasPrice(
                  bigToBigint(new Big(value || 0), networkFee.displayDecimals)
                )
              }
            />
          </>
        )}
      </Row>
      <Space y={20} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2>Fee Amount</AvaText.Body2>
        <AvaText.Heading3>
          {totalFeeBig.toString()} {network?.networkToken?.symbol}
        </AvaText.Heading3>
      </Row>
      <AvaText.Body3
        currency
        color={theme.colorText2}
        textStyle={{ marginTop: 4, alignSelf: 'flex-end' }}>
        {(Number.parseFloat(totalFeeBig.toString()) * nativeTokenPrice).toFixed(
          2
        )}
      </AvaText.Body3>
      {maxGasPrice && newFees.bnFee > BigInt(maxGasPrice) && (
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
