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
import { GasPrice } from 'utils/GasPriceHook'
import { bnToLocaleString, numberToBN } from '@avalabs/avalanche-wallet-sdk'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { BN } from 'avalanche'
import { Popable } from 'react-native-popable'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'

enum FeePreset {
  Normal = 'Normal',
  Fast = 'Fast',
  Instant = 'Instant',
  Custom = 'Custom'
}

const NetworkFeeSelector = ({
  network,
  onSettingsPressed,
  networkFeeAvax,
  networkFeeInCurrency,
  gasPrice,
  gasLimit,
  onWeightedGas,
  weights = defaultPresetWeights
}: {
  network: Network
  onSettingsPressed: () => void
  networkFeeAvax: string
  networkFeeInCurrency: number
  gasPrice: GasPrice
  gasLimit: number
  onWeightedGas: (price: GasPrice) => void
  weights?: Weights
}) => {
  const { theme } = useApplicationContext()
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Normal)
  const [customGasPrice, setCustomGasPrice] = useState(
    weights[FeePreset.Custom].toString()
  )
  const decimals = useMemo(
    () =>
      network.vmName === NetworkVMType.EVM
        ? network.networkToken.decimals - 9
        : network.networkToken.decimals,
    [network]
  )

  const displayValues = useMemo(() => {
    function roundGas(gasPrice: BN, weight: number) {
      return Number.parseFloat(
        bnToLocaleString(gasPrice.muln(weight), decimals)
      ).toFixed(0)
    }

    return {
      Normal: roundGas(gasPrice.bn, weights[FeePreset.Normal]),
      Fast: roundGas(gasPrice.bn, weights[FeePreset.Fast]),
      Instant: roundGas(gasPrice.bn, weights[FeePreset.Instant]),
      Custom: customGasPrice
    }
  }, [customGasPrice, gasPrice.bn, decimals, weights])

  const selectedGasValue = useMemo(
    () => displayValues[selectedPreset],
    [displayValues, selectedPreset]
  )
  const selectedGasBn = useMemo(
    () => numberToBN(Number.parseInt(selectedGasValue, 10), decimals),
    [decimals, selectedGasValue]
  )

  useEffect(() => {
    onWeightedGas({ bn: selectedGasBn, value: selectedGasValue })
  }, [onWeightedGas, selectedGasBn, selectedGasValue, selectedPreset])

  return (
    <>
      <Row>
        <Popable
          content={
            <PoppableGasAndLimit
              gasLimit={gasLimit}
              gasPrice={bnToLocaleString(selectedGasBn, decimals)}
            />
          }
          position={'right'}
          style={{ minWidth: 200 }}
          backgroundColor={theme.colorBg3}>
          <AvaText.Body2>{`Network Fee ${gasLimit ? 'ⓘ' : ''}`}</AvaText.Body2>
        </Popable>
        <View style={{ position: 'absolute', right: 0, top: -8 }}>
          <AvaButton.Icon onPress={onSettingsPressed}>
            <SettingsCogSVG />
          </AvaButton.Icon>
        </View>
      </Row>
      <Space y={4} />
      <Row style={{ alignItems: 'baseline' }}>
        <AvaText.Heading3>{networkFeeAvax} AVAX</AvaText.Heading3>
        <Space x={4} />
        <AvaText.Body3 textStyle={{ paddingBottom: 2 }} currency>
          {networkFeeInCurrency}
        </AvaText.Body3>
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-evenly',
          alignItems: 'center'
        }}>
        <FeeSelector
          label={FeePreset.Normal}
          selected={selectedPreset === FeePreset.Normal}
          onSelect={() => setSelectedPreset(FeePreset.Normal)}
          value={displayValues[FeePreset.Normal]}
        />
        <FeeSelector
          label={FeePreset.Fast}
          selected={selectedPreset === FeePreset.Fast}
          onSelect={() => setSelectedPreset(FeePreset.Fast)}
          value={displayValues[FeePreset.Fast]}
        />
        <FeeSelector
          label={FeePreset.Instant}
          selected={selectedPreset === FeePreset.Instant}
          onSelect={() => setSelectedPreset(FeePreset.Instant)}
          value={displayValues[FeePreset.Instant]}
        />
        <FeeSelector
          editable
          label={FeePreset.Custom}
          selected={selectedPreset === FeePreset.Custom}
          onSelect={() => setSelectedPreset(FeePreset.Custom)}
          value={displayValues[FeePreset.Custom]}
          onValueEntered={value => setCustomGasPrice(value || '0')}
        />
      </Row>
    </>
  )
}

export type Weights = {
  Normal: number
  Fast: number
  Instant: number
  Custom: number
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
          text={value ?? ''}
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

const defaultPresetWeights = {
  [FeePreset.Normal]: 1,
  [FeePreset.Fast]: 1.05,
  [FeePreset.Instant]: 1.15,
  [FeePreset.Custom]: 25
}

export default NetworkFeeSelector
