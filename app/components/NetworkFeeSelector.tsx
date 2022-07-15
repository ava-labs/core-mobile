import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { TextInput, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import { Opacity50 } from 'resources/Constants'
import { Popable } from 'react-native-popable'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNetworkFee, selectNetworkFee } from 'store/networkFee'
import { BigNumber } from 'ethers'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { bigToEthersBigNumber, ethersBigNumberToBig } from '@avalabs/utils-sdk'
import Big from 'big.js'

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

const NetworkFeeSelector = ({
  gasLimit,
  onChange
}: {
  gasLimit: number
  onChange?(gasLimit: number, gasPrice: BigNumber, feePreset: FeePreset): void
}) => {
  const { navigate } = useNavigation<NavigationProp<any>>()
  const { theme } = useApplicationContext()
  const networkFee = useSelector(selectNetworkFee)
  const dispatch = useDispatch()
  const network = useActiveNetwork()
  const isBtcNetwork = network.vmName === NetworkVMType.BITCOIN
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Normal)
  const [customGasPrice, setCustomGasPrice] = useState(
    BigNumber.from(networkFee.low)
  )
  const selectedGasPrice = useMemo(() => {
    switch (selectedPreset) {
      case FeePreset.Custom:
        return customGasPrice
      default:
        return networkFee[FeePresetNetworkFeeMap[selectedPreset]]
    }
  }, [customGasPrice, networkFee, selectedPreset])
  const totalFeeString = useMemo(() => {
    return ethersBigNumberToBig(
      selectedGasPrice.mul(gasLimit),
      networkFee.nativeTokenDecimals
    ).toString()
  }, [gasLimit, networkFee.nativeTokenDecimals, selectedGasPrice])

  useEffect(() => {
    onChange?.(gasLimit, selectedGasPrice, selectedPreset)
  }, [gasLimit, selectedGasPrice, selectedPreset])

  useEffect(fetchNetworkGasPrices, [])

  function fetchNetworkGasPrices() {
    dispatch(fetchNetworkFee)
  }

  function onGasLimitChange(newGasLimit: number) {
    onChange?.(newGasLimit, selectedGasPrice, selectedPreset)
  }

  const convertFeeToUnit = (value: BigNumber) =>
    ethersBigNumberToBig(value, networkFee.displayDecimals).toFixed(0)

  const displayGasValues = useMemo(() => {
    return {
      [FeePreset.Normal]: convertFeeToUnit(networkFee.low),
      [FeePreset.Fast]: convertFeeToUnit(networkFee.medium),
      [FeePreset.Instant]: convertFeeToUnit(networkFee.high),
      [FeePreset.Custom]: convertFeeToUnit(customGasPrice)
    }
  }, [customGasPrice, networkFee.high, networkFee.low, networkFee.medium])

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Popable
          content={
            <PoppableGasAndLimit
              gasLimit={gasLimit}
              gasPrice={`${convertFeeToUnit(selectedGasPrice)} ${
                networkFee.unit
              }`}
            />
          }
          position={'right'}
          style={{ minWidth: 200 }}
          backgroundColor={theme.colorBg3}>
          <AvaText.Body2>{`Network Fee ${
            totalFeeString ? 'ⓘ' : ''
          }`}</AvaText.Body2>
        </Popable>
        {network?.vmName === NetworkVMType.EVM && (
          <View>
            <AvaButton.Icon
              onPress={() => {
                navigate(AppNavigation.Modal.EditGasLimit, {
                  gasLimit: gasLimit,
                  gasPrice: customGasPrice,
                  onSave: onGasLimitChange
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
          value={displayGasValues[FeePreset.Custom]}
          onValueEntered={value =>
            setCustomGasPrice(
              bigToEthersBigNumber(
                new Big(value || 0),
                networkFee.displayDecimals
              )
            )
          }
        />
      </Row>
      <Space y={20} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2>Fee Amount</AvaText.Body2>
        <AvaText.Heading3>
          {totalFeeString} {network?.networkToken?.symbol}
        </AvaText.Heading3>
      </Row>
    </>
  )
}

const FeeSelector: FC<{
  label: string
  value?: string
  selected: boolean
  onSelect: (value: string) => void
  editable?: boolean
  onValueEntered?: (value: string) => void
}> = ({
  label,
  selected,
  onSelect,
  onValueEntered,
  value,
  editable = false
}) => {
  const { theme } = useApplicationContext()
  const [showInput, setShowInput] = useState(false)

  let inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (selected && editable) {
      setShowInput(true)
    }
    if (!selected) {
      setShowInput(false)
      inputRef.current?.blur()
    }
  }, [editable, selected])

  return (
    <View
      style={{
        alignItems: 'center',
        width: 75,
        height: 48
      }}>
      {showInput && (
        <InputText
          text={value?.toString() ?? ''}
          autoFocus
          onChangeText={text => onValueEntered?.(text)}
          keyboardType={'numeric'}
          onInputRef={inputRef1 => {
            inputRef = inputRef1
            inputRef1.current?.setNativeProps({
              style: {
                backgroundColor: theme.colorText1,
                width: 75,
                height: 48,
                marginTop: -12,
                fontFamily: 'Inter-SemiBold',
                textAlign: 'center',
                textAlignVertical: 'center',
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                color: theme.colorBg2,
                fontSize: 14,
                lineHeight: 24
              }
            })
          }}
          mode={'amount'}
        />
      )}
      {!showInput && (
        <AvaButton.Base onPress={() => onSelect(label)}>
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
            <AvaText.ButtonMedium
              textStyle={{
                color: selected ? theme.colorBg2 : theme.colorText2
              }}>
              {label}
            </AvaText.ButtonMedium>
            <AvaText.ButtonMedium
              textStyle={{
                color: selected ? theme.colorBg2 : theme.colorText2
              }}>
              {value}
            </AvaText.ButtonMedium>
          </View>
        </AvaButton.Base>
      )}
    </View>
  )
}
export default NetworkFeeSelector
