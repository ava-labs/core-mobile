import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { TextInput, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import { Opacity50 } from 'resources/Constants'
import { GasPrice } from 'utils/GasPriceHook'
import { bnToLocaleString } from '@avalabs/avalanche-wallet-sdk'
import { calculateGasAndFees, Fees } from 'utils/calculateGasAndFees'
import { bigToBN, stringToBN } from '@avalabs/utils-sdk'
import Big from 'big.js'
import {useWalletContext, useWalletStateContext} from '@avalabs/wallet-react-components';

export enum GasFeeModifier {
  NORMAL = 'NORMAL',
  FAST = 'FAST',
  INSTANT = 'INSTANT',
  CUSTOM = 'CUSTOM'
}
interface Props {
  gasPrice: GasPrice
  limit: string
  onChange(gasLimit: string, gasPrice: GasPrice, feeType: GasFeeModifier): void
  gasPriceEditDisabled?: boolean
  maxGasPrice?: string
  selectedGasFeeModifier?: GasFeeModifier
  defaultGasPrice?: GasPrice
  onSettingsPressed?: () => void
}

function CustomFees({
  gasPrice,
  limit,
  onChange,
  gasPriceEditDisabled = false,
  maxGasPrice,
  selectedGasFeeModifier,
  defaultGasPrice,
  onSettingsPressed
}: Props) {
  const [customGasPrice, setCustomGasPrice] = useState(gasPrice)
  const [customGasLimit, setCustomGasLimit] = useState<string>(limit)
  const { avaxPrice } = useWalletStateContext()
  const [newFees, setNewFees] = useState<Fees>(
    calculateGasAndFees(gasPrice, limit, avaxPrice)
  )
  const [originalGas] = useState<GasPrice>(defaultGasPrice || gasPrice)
  const [customGasInput, setCustomGasInput] = useState(
    selectedGasFeeModifier === GasFeeModifier.CUSTOM
      ? parseInt(bnToLocaleString(gasPrice.bn, 9)).toString()
      : parseInt(bnToLocaleString(originalGas.bn, 9)).toString()
  )
  const [isGasPriceTooHigh, setIsGasPriceTooHigh] = useState(false)
  const [showEditGasLimit, setShowEditGasLimit] = useState(false)
  const [selectedFee, setSelectedFee] = useState<GasFeeModifier>(
    selectedGasFeeModifier ?? GasFeeModifier.NORMAL
  )

  const handleGasChange = useCallback(
    (gas: GasPrice, modifier: GasFeeModifier) => {
      setIsGasPriceTooHigh(false)
      setCustomGasPrice(gas)
      const newFees = calculateGasAndFees(gas, customGasLimit, avaxPrice)
      if (maxGasPrice && newFees.bnFee.gte(stringToBN(maxGasPrice, 0))) {
        setIsGasPriceTooHigh(true)
        return
      }

      if (modifier === GasFeeModifier.CUSTOM) {
        setCustomGasInput(gas.value || '0')
      }

      setNewFees(newFees)

      onChange(customGasLimit, gas, modifier)
    },
    [avaxPrice, customGasLimit, maxGasPrice, onChange]
  )

  const gasModifier = useCallback(
    (amount: number) => {
      // take current GasPrice (BN) and add amount .05 | .15 | custom
      const bigGas = new Big(bnToLocaleString(originalGas.bn, 9))
      const newBigGas = bigGas.times(amount).plus(bigGas)

      return {
        bn: bigToBN(newBigGas, 9),
        value: newBigGas.toString()
      }
    },
    [originalGas.bn]
  )

  const updateGasFee = useCallback(
    (modifier: GasFeeModifier) => {
      if (!modifier) {
        return
      }
      setSelectedFee(modifier)
      switch (modifier) {
        case GasFeeModifier.FAST:
          handleGasChange(gasModifier(0.005), modifier)
          break
        case GasFeeModifier.INSTANT:
          handleGasChange(gasModifier(0.15), modifier)
          break
        case GasFeeModifier.CUSTOM:
          handleGasChange(
            {
              bn: stringToBN(customGasInput, 9),
              value: customGasInput
            },
            modifier
          )
          break
        default:
          handleGasChange(originalGas, GasFeeModifier.NORMAL)
      }
    },
    [customGasInput, gasModifier, handleGasChange, originalGas]
  )

  // this should update the gas prices when there is a change (e.g. from hook)
  useEffect(() => {
    selectedGasFeeModifier && updateGasFee(selectedGasFeeModifier)
  }, [selectedGasFeeModifier, updateGasFee])

  // const presetWeights = useMemo(() => {
  //   if (weights) {
  //     defaultPresetWeights[GasFeeModifier.Normal] = weights.normal
  //     defaultPresetWeights[GasFeeModifier.Fast] = weights.fast
  //     defaultPresetWeights[GasFeeModifier.Instant] = weights.instant
  //     defaultPresetWeights[GasFeeModifier.Custom] = weights.custom
  //   }
  //   if (customGasPrice) {
  //     defaultPresetWeights[GasFeeModifier.Custom] = mustNumber(
  //       () => Number.parseFloat(customGasPrice),
  //       0
  //     )
  //   }
  //   return { ...defaultPresetWeights }
  // }, [customGasPrice])

  // useEffect(() => {
  //   const weightedGas = weightedGasPrice(
  //     gasPrice,
  //     selectedPreset,
  //     presetWeights[selectedPreset]
  //   )
  //   onWeightedGas(weightedGas)
  // }, [selectedPreset, gasPrice, presetWeights])
  //
  // useEffect(() => {
  //   //lazy initial setup of customGasPrice
  //   if (customGasPrice === '0' && gasPrice.value) {
  //     setCustomGasPrice(gasPrice.value)
  //   }
  // }, [gasPrice])

  return (
    <>
      <Row>
        <AvaText.Body2>Network Fee</AvaText.Body2>
        <View style={{ position: 'absolute', right: 0, top: -8 }}>
          <AvaButton.Icon onPress={onSettingsPressed}>
            <SettingsCogSVG />
          </AvaButton.Icon>
        </View>
      </Row>
      <Space y={4} />
      <Row style={{ alignItems: 'baseline' }}>
        <AvaText.Heading3>{newFees.fee} AVAX</AvaText.Heading3>
        <Space x={4} />
        <AvaText.Body3 textStyle={{ paddingBottom: 2 }}>
          ${newFees.feeUSD}
        </AvaText.Body3>
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-evenly',
          alignItems: 'center'
        }}>
        <FeeSelector
          label={'Normal'}
          selected={selectedFee === GasFeeModifier.NORMAL}
          onSelect={() => updateGasFee(GasFeeModifier.NORMAL)}>
          <>
            <AvaText.Body1>
              {ModifierDefaults[GasFeeModifier.NORMAL]}
            </AvaText.Body1>
          </>
        </FeeSelector>
        <FeeSelector
          label={'Fast'}
          selected={selectedFee === GasFeeModifier.FAST}
          onSelect={() => updateGasFee(GasFeeModifier.FAST)}>
          <>
            <AvaText.Body1>
              {ModifierDefaults[GasFeeModifier.FAST]}
            </AvaText.Body1>
          </>
        </FeeSelector>
        <FeeSelector
          label={'Instant'}
          selected={selectedFee === GasFeeModifier.INSTANT}
          onSelect={() => updateGasFee(GasFeeModifier.INSTANT)}>
          <>
            <AvaText.Body1>
              {ModifierDefaults[GasFeeModifier.INSTANT]}
            </AvaText.Body1>
          </>
        </FeeSelector>
        <FeeSelector
          editable
          label={'Custom'}
          selected={selectedFee === GasFeeModifier.CUSTOM}
          onSelect={() => updateGasFee(GasFeeModifier.CUSTOM)}
          value={customGasInput}
          onValueEntered={value => {
            const safeValue = value ? value : '0'
            handleGasChange(
              {
                bn: stringToBN(safeValue, 9),
                value: safeValue
              },
              GasFeeModifier.CUSTOM
            )
          }}
        />
      </Row>
    </>
  )
}

// export type Weights = {
//   normal: number
//   fast: number
//   instant: number
//   custom: number
// }
//
// const weightedGasPrice = (
//   gasPrice: GasPrice,
//   selectedGasPreset: FeePreset,
//   presetValue: number
// ) => {
//   if (selectedGasPreset === FeePreset.Custom) {
//     const bn = numberToBN(presetValue, 9)
//     return {
//       bn: bn,
//       value: bnToLocaleString(bn, 9)
//     } as GasPrice
//   } else {
//     const bn1 = gasPrice.bn.muln(presetValue)
//     return {
//       bn: bn1,
//       value: bnToLocaleString(bn1, 9)
//     } as GasPrice
//   }
// }

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
  editable = false,
  children
}) => {
  const { theme } = useApplicationContext()
  const [showInput, setShowInput] = useState(false)
  const [selectedAtLeastOnce, setSelectedAtLeastOnce] = useState(false)

  let inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (selected && editable) {
      setShowInput(true)
      setSelectedAtLeastOnce(true)
    }
    if (!selected) {
      setShowInput(false)
      inputRef.current?.blur()
    }
  }, [selected])

  return (
    <View
      style={{
        alignItems: 'center',
        width: 66,
        height: 40
      }}>
      {showInput && (
        <InputText
          text={value?.toString()}
          autoFocus
          onChangeText={text => onValueEntered?.(text)}
          keyboardType={'numeric'}
          onInputRef={inputRef1 => {
            inputRef = inputRef1
            inputRef1.current?.setNativeProps({
              style: {
                backgroundColor: theme.colorText1,
                width: 66,
                height: 40,
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
      {/*{!showInput && (*/}
      {/*  <AvaButton.Base onPress={() => onSelect(label)}>*/}
      {/*    <View*/}
      {/*      focusable*/}
      {/*      style={{*/}
      {/*        width: 66,*/}
      {/*        height: 40,*/}
      {/*        borderRadius: 8,*/}
      {/*        alignItems: 'center',*/}
      {/*        justifyContent: 'center',*/}
      {/*        backgroundColor: selected*/}
      {/*          ? theme.colorText1*/}
      {/*          : theme.colorBg3 + Opacity50*/}
      {/*      }}>*/}
      {/*      <AvaText.ButtonMedium*/}
      {/*        textStyle={{*/}
      {/*          color: selected ? theme.colorBg2 : theme.colorText2*/}
      {/*        }}>*/}
      {/*        {editable && selectedAtLeastOnce && value ? value : label}*/}
      {/*      </AvaText.ButtonMedium>*/}
      {/*    </View>*/}
      {/*    {children}*/}
      {/*  </AvaButton.Base>*/}
      {/*)}*/}
    </View>
  )
}

const ModifierDefaults = {
  [GasFeeModifier.NORMAL]: 1,
  [GasFeeModifier.FAST]: 1.05,
  [GasFeeModifier.INSTANT]: 1.15
}

export default CustomFees
// function useWalletContext(): { avaxPrice: any } {
//   throw new Error('Function not implemented.')
// }
