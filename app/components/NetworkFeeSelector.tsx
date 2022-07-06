import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import { TextInput, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import { Space } from 'components/Space'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { Popable } from 'react-native-popable'
import PoppableGasAndLimit from 'components/PoppableGasAndLimit'
import { BigNumber } from 'ethers'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { calculateGasAndFees } from 'utils/Utils'
import { formatUnits } from 'ethers/lib/utils'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import Logger from 'utils/Logger'
import isEmpty from 'lodash.isempty'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'

function getUpToTwoDecimals(input: BigNumber, decimals: number) {
  const result = input
    .mul(100)
    .div(10 ** decimals)
    .toNumber()

  return formatUnits(result, 2)
}

export enum FeePreset {
  Normal = 'Normal',
  Fast = 'Fast',
  Instant = 'Instant',
  Custom = 'Custom'
}

interface Props {
  gasPrice: BigNumber
  limit: number
  onChange?(gasLimit: number, gasPrice: BigNumber, feePreset: FeePreset): void
  maxGasPrice?: string
  currentModifier?: FeePreset
  network: Network
  disableGasPriceEditing?: boolean
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>['navigation']

const NetworkFeeSelector = ({
  gasPrice,
  limit,
  onChange,
  maxGasPrice,
  currentModifier,
  disableGasPriceEditing
}: Props) => {
  const { navigate } = useNavigation<NavigationProp>()
  const { theme, appHook } = useApplicationContext()
  const { currencyFormatter } = appHook
  const network = useActiveNetwork()
  const networkFee = useNetworkFee().networkFees
  const tokenPrice = useNativeTokenPrice().nativeTokenPrice
  const currency = useSelector(selectSelectedCurrency)
  const [customGasPrice, setCustomGasPrice] = useState(gasPrice)
  const [customGasLimit, setCustomGasLimit] = useState<number>()
  const [isGasPriceTooHigh, setIsGasPriceTooHigh] = useState(false)
  const gasLimit = customGasLimit ?? limit
  const [newFees, setNewFees] =
    useState<ReturnType<typeof calculateGasAndFees>>()
  const [customGasInput, setCustomGasInput] = useState(
    currentModifier === FeePreset.Custom
      ? getUpToTwoDecimals(
          gasPrice,
          networkFee?.displayDecimals ?? 9
        ).toString()
      : getUpToTwoDecimals(
          networkFee?.low ?? BigNumber.from(0),
          networkFee?.displayDecimals ?? 9
        ).toString()
  )
  const [selectedFee, setSelectedFee] = useState<FeePreset>(
    networkFee?.isFixedFee
      ? FeePreset.Normal
      : currentModifier || FeePreset.Normal
  )

  useEffect(() => {
    const newFees = calculateGasAndFees({
      gasPrice,
      tokenPrice,
      tokenDecimals: network?.networkToken?.decimals,
      gasLimit
    })
    setNewFees(newFees)
  }, [])

  const handleGasChange = useCallback(
    (gas: BigNumber, modifier: FeePreset) => {
      setIsGasPriceTooHigh(false)
      setCustomGasPrice(gas)
      const newFees = calculateGasAndFees({
        gasPrice: gas,
        tokenPrice,
        tokenDecimals: network?.networkToken?.decimals,
        gasLimit
      })

      if (maxGasPrice && newFees.bnFee.gt(maxGasPrice)) {
        setIsGasPriceTooHigh(true)
        return
      }

      if (modifier === FeePreset.Custom) {
        setCustomGasInput(
          getUpToTwoDecimals(gas, networkFee?.displayDecimals || 0)
        )
      }

      setNewFees(newFees)
      onChange?.(gasLimit, gas, modifier)
    },
    [
      tokenPrice,
      network?.networkToken.decimals,
      gasLimit,
      maxGasPrice,
      onChange,
      networkFee?.displayDecimals
    ]
  )

  const updateGasFee = useCallback(
    (modifier?: FeePreset) => {
      if (!modifier || !networkFee) {
        return
      }
      setSelectedFee(modifier)
      switch (modifier) {
        case FeePreset.Fast: {
          handleGasChange(networkFee.medium, modifier)
          break
        }
        case FeePreset.Instant: {
          handleGasChange(networkFee.high, modifier)
          break
        }
        case FeePreset.Custom: {
          handleGasChange(
            BigNumber.from(parseInt(customGasInput)).mul(
              BigNumber.from(10).pow(networkFee?.displayDecimals ?? 9)
            ),
            modifier
          )
          break
        }
        default:
          handleGasChange(networkFee.low, FeePreset.Normal)
      }
    },
    [customGasInput, handleGasChange, networkFee]
  )

  useEffect(() => {
    if (networkFee) {
      setCustomGasInput(
        getUpToTwoDecimals(networkFee.low, networkFee.displayDecimals || 0)
      )
      // if the network fee is fixed, that means we only show Normal.
      networkFee.isFixedFee
        ? updateGasFee(FeePreset.Normal)
        : updateGasFee(currentModifier)
    }
  }, [networkFee, currentModifier, updateGasFee])

  return (
    // <BottomSheetModalProvider>
    <View>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Popable
          content={
            <PoppableGasAndLimit
              gasLimit={gasLimit}
              gasPrice={gasPrice.toNumber().toFixed(2)}
            />
          }
          position={'right'}
          style={{ minWidth: 200 }}
          backgroundColor={theme.colorBg3}>
          <AvaText.Body2 color={theme.white}>Network Fee ⓘ</AvaText.Body2>
        </Popable>

        {network?.vmName === NetworkVMType.EVM && (
          <AvaButton.Icon
            onPress={() => {
              navigate(AppNavigation.Modal.EditGasLimit, {
                gasLimit,
                gasPrice: customGasPrice,
                onSave: (newLimit: number) => {
                  setCustomGasLimit(newLimit)
                  setNewFees(
                    calculateGasAndFees({
                      gasPrice: customGasPrice,
                      tokenPrice,
                      tokenDecimals: network?.networkToken?.decimals,
                      gasLimit: newLimit
                    })
                  )
                  onChange?.(
                    newLimit,
                    customGasPrice,
                    currentModifier ?? FeePreset.Normal
                  )
                }
              })
            }}>
            <SettingsCogSVG />
          </AvaButton.Icon>
        )}
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-evenly',
          alignItems: 'center'
        }}>
        <FeeSelector
          label={FeePreset.Normal}
          selected={selectedFee === FeePreset.Normal}
          onSelect={() => updateGasFee(FeePreset.Normal)}
          value={getUpToTwoDecimals(networkFee.low, networkFee.displayDecimals)}
        />
        {!networkFee?.isFixedFee && (
          <>
            <FeeSelector
              label={FeePreset.Fast}
              selected={selectedFee === FeePreset.Fast}
              onSelect={() => updateGasFee(FeePreset.Fast)}
              value={getUpToTwoDecimals(
                networkFee.medium,
                networkFee.displayDecimals
              )}
            />
            <FeeSelector
              label={FeePreset.Instant}
              selected={selectedFee === FeePreset.Instant}
              onSelect={() => updateGasFee(FeePreset.Instant)}
              value={getUpToTwoDecimals(
                networkFee.high,
                networkFee.displayDecimals
              )}
            />
            <FeeSelector
              label={FeePreset.Custom}
              selected={selectedFee === FeePreset.Custom}
              onSelect={() => updateGasFee(FeePreset.Custom)}
              value={customGasInput}>
              <TextInput
                value={parseInt(customGasInput).toString()}
                editable={!disableGasPriceEditing}
                autoFocus
                keyboardType={'numeric'}
                maxLength={2}
                onChangeText={value => {
                  if (isEmpty(value)) {
                    handleGasChange(BigNumber.from(0), FeePreset.Custom)
                  } else {
                    try {
                      handleGasChange(
                        BigNumber.from(value).mul(
                          BigNumber.from(10).pow(
                            networkFee?.displayDecimals ?? 9
                          )
                        ),
                        FeePreset.Custom
                      )
                    } catch (e) {
                      Logger.error('error', e)
                    }
                  }
                }}
              />
            </FeeSelector>
          </>
        )}
      </Row>
      {isGasPriceTooHigh && (
        <>
          <Space y={4} />
          <AvaText.Body3 color={theme.colorError}>
            Insufficient balance
          </AvaText.Body3>
        </>
      )}
      <Space y={20} />
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <AvaText.Body2 color={theme.white}>Fee Amount</AvaText.Body2>
        <AvaText.Heading3>
          {newFees?.fee} {network?.networkToken?.symbol}
        </AvaText.Heading3>
        <Space x={4} />
        <AvaText.Body3 textStyle={{ paddingBottom: 2 }}>
          {!isNaN(Number(newFees?.feeUSD))
            ? `${currencyFormatter(Number(newFees?.feeUSD))} ${currency}`
            : ''}
        </AvaText.Body3>
      </Row>
    </View>
  )
}

export type Weights = {
  Normal: number
  Fast: number
  Instant: number
  Custom: number
}

export const FeeSelector: FC<{
  label: string
  value?: string
  selected: boolean
  onSelect: () => void
}> = ({ label, selected, onSelect, value, children }) => {
  const { theme } = useApplicationContext()
  const hasChildrenAndSelected = selected && !!children
  // BigNumber.from will throw an error if we have fractions here. Plus, this matches what extension is doing
  const sanitizedValue = parseInt(value ?? '0').toString()

  return (
    <View
      style={{
        alignItems: 'center',
        width: 75,
        height: 48
      }}>
      <AvaButton.Base onPress={onSelect}>
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
          {hasChildrenAndSelected ? (
            <>{children}</>
          ) : (
            <AvaText.ButtonMedium
              textStyle={{
                color: selected ? theme.colorBg2 : theme.colorText2
              }}>
              {sanitizedValue}
            </AvaText.ButtonMedium>
          )}
        </View>
      </AvaButton.Base>
    </View>
  )
}

export default NetworkFeeSelector
