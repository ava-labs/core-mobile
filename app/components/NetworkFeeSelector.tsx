import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { TextInput, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
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
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { bigToEthersBigNumber, ethersBigNumberToBig } from '@avalabs/utils-sdk'
import Big from 'big.js'
import InfoSVG from 'components/svg/InfoSVG'
import { WalletScreenProps } from 'navigation/types'

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
  gasLimit,
  onChange
}: {
  gasLimit: number
  onChange?(gasLimit: number, gasPrice: BigNumber, feePreset: FeePreset): void
}) => {
  const { navigate } = useNavigation<NavigationProp>()
  const { theme } = useApplicationContext()
  const networkFee = useSelector(selectNetworkFee)
  const dispatch = useDispatch()
  const network = useActiveNetwork()
  const isBtcNetwork = network.vmName === NetworkVMType.BITCOIN
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Normal)
  const [customGasPrice, setCustomGasPrice] = useState(BigNumber.from(0))

  useEffect(() => {
    if (customGasPrice.isZero()) {
      setCustomGasPrice(BigNumber.from(networkFee.low))
    }
  }, [customGasPrice, networkFee.low])

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
    // ignore onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasLimit, selectedGasPrice, selectedPreset])

  useEffect(fetchNetworkGasPrices, [dispatch])

  function fetchNetworkGasPrices() {
    dispatch(fetchNetworkFee)
  }

  function onGasLimitChange(newGasLimit: number) {
    onChange?.(newGasLimit, selectedGasPrice, selectedPreset)
  }

  const convertFeeToUnit = useCallback(
    (value: BigNumber) =>
      ethersBigNumberToBig(value, networkFee.displayDecimals).toFixed(0),
    [networkFee.displayDecimals]
  )

  const displayGasValues = useMemo(() => {
    return {
      [FeePreset.Normal]: convertFeeToUnit(networkFee.low),
      [FeePreset.Fast]: convertFeeToUnit(networkFee.medium),
      [FeePreset.Instant]: convertFeeToUnit(networkFee.high),
      [FeePreset.Custom]: convertFeeToUnit(customGasPrice)
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
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Body2>Network Fee</AvaText.Body2>
              <Space x={4} />
              <InfoSVG />
            </Row>
          </Popable>
        )}
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
          </>
        )}
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

export const FeeSelector: FC<{
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

  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (selected && editable) {
      setShowInput(true)
    }
    if (!selected) {
      setShowInput(false)
      inputRef.current?.blur()
    }
  }, [editable, selected])

  const handleSelect = () => {
    if (editable) setShowInput(true)
    onSelect(label)
  }

  return (
    <View
      style={{
        alignItems: 'center',
        width: 75,
        height: 48
      }}>
      {showInput && (
        <ButtonWrapper selected={selected}>
          <ButtonText selected={selected}>{label}</ButtonText>
          <InputText
            text={value?.toString() ?? ''}
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
      )}
      {!showInput && (
        <AvaButton.Base onPress={handleSelect}>
          <ButtonWrapper selected={selected}>
            <ButtonText selected={selected}>{label}</ButtonText>
            <ButtonText selected={selected}>{value}</ButtonText>
          </ButtonWrapper>
        </AvaButton.Base>
      )}
    </View>
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
