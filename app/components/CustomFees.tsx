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
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { useSelector } from 'react-redux'
import { selectTokenById } from 'store/balance'

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
  const theme = useApplicationContext().theme
  const [customGasPrice, setCustomGasPrice] = useState(gasPrice)
  const [customGasLimit, setCustomGasLimit] = useState<string>(limit)
  const avaxToken = useSelector(selectTokenById('AVAX'))
  const [newFees, setNewFees] = useState<Fees>(
    calculateGasAndFees(gasPrice, limit, avaxToken?.priceUSD ?? 0)
  )
  const navigation = useNavigation()
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
      const newFees = calculateGasAndFees(
        gas,
        customGasLimit,
        avaxToken?.priceUSD ?? 0
      )
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
    [avaxToken, customGasLimit, maxGasPrice, onChange]
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

  return (
    <View style={{ paddingVertical: 16 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: -16 }}>
        <AvaText.Body2>Network Fee</AvaText.Body2>
        <AvaButton.Icon
          onPress={() => {
            navigation.navigate(AppNavigation.Modal.EditGasLimit, {
              gasLimit: customGasLimit,
              networkFee: newFees.fee,
              onSave: (newLimit: number) => {
                setCustomGasLimit(newLimit.toString())
                setNewFees(
                  calculateGasAndFees(
                    customGasPrice,
                    limit,
                    avaxToken?.priceUSD ?? 0
                  )
                )
                onChange(
                  limit,
                  customGasPrice,
                  selectedGasFeeModifier ?? GasFeeModifier.NORMAL
                )
              }
            })
          }}>
          <SettingsCogSVG />
        </AvaButton.Icon>
      </Row>
      <Space y={16} />
      <Row
        style={{
          justifyContent: 'space-between'
        }}>
        <FeeSelector
          label={'Normal'}
          value={gasModifier(ModifierDefaults[GasFeeModifier.NORMAL]).value}
          selected={selectedFee === GasFeeModifier.NORMAL}
          onSelect={() => updateGasFee(GasFeeModifier.NORMAL)}
        />
        <FeeSelector
          label={'Fast'}
          value={gasModifier(ModifierDefaults[GasFeeModifier.FAST]).value}
          selected={selectedFee === GasFeeModifier.FAST}
          onSelect={() => updateGasFee(GasFeeModifier.FAST)}
        />
        <FeeSelector
          label={'Instant'}
          value={gasModifier(ModifierDefaults[GasFeeModifier.INSTANT]).value}
          selected={selectedFee === GasFeeModifier.INSTANT}
          onSelect={() => updateGasFee(GasFeeModifier.INSTANT)}
        />
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
      <Space y={16} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2>Network Fee Amount</AvaText.Body2>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading3>{newFees.fee} AVAX</AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3 textStyle={{ paddingBottom: 2 }}>
            ${newFees.feeUSD}
          </AvaText.Body3>
        </View>
      </Row>
      {isGasPriceTooHigh && (
        <AvaText.Body1 color={'red'}>Gas is too high</AvaText.Body1>
      )}
    </View>
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
  editable = false
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
        <AvaButton.Base
          style={{ alignItems: 'center' }}
          onPress={() => onSelect(label)}>
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
              {editable && selectedAtLeastOnce && value ? value : label}
            </AvaText.ButtonMedium>
            <AvaText.Caption
              textStyle={{
                color: selected ? theme.colorBg2 : theme.colorText2
              }}>
              {value}
            </AvaText.Caption>
          </View>
        </AvaButton.Base>
      )}
    </View>
  )
}

const ModifierDefaults = {
  [GasFeeModifier.NORMAL]: 0,
  [GasFeeModifier.FAST]: 0.05,
  [GasFeeModifier.INSTANT]: 0.15
}

export default CustomFees
