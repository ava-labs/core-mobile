import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import QRScanSVG from 'components/svg/QRScanSVG'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import { useSendContext } from 'contexts/SendContext'
import FlexSpacer from 'components/FlexSpacer'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { Amount } from 'types'
import NetworkFeeSelector, { FeePreset } from 'components/NetworkFeeSelector'
import { Eip1559Fees } from 'utils/Utils'

const SendTokenForm = ({
  network,
  maxAmount,
  addressPlaceholder,
  error,
  isValid,
  isSending,
  onOpenQRScanner,
  onSend,
  handleFeesChange,
  estimatedFee,
  supportsAvalancheDynamicFee = false
}: {
  network: Network
  maxAmount: Amount | undefined
  addressPlaceholder: string
  error: string | undefined
  isValid: boolean
  isSending: boolean
  onOpenQRScanner: () => void
  onSend: () => void
  handleFeesChange?(fees: Eip1559Fees, feePreset: FeePreset): void
  estimatedFee?: bigint
  supportsAvalancheDynamicFee?: boolean
}): JSX.Element => {
  const {
    setToken,
    token,
    setAmount,
    amount,
    toAddress,
    setToAddress,
    setCanValidate
  } = useSendContext()
  const [isAddressTouched, setIsAddressTouched] = useState(false)
  const [isTokenTouched, setIsTokenTouched] = useState(false)
  const [isAmountTouched, setIsAmountTouched] = useState(false)

  const handleSend = (): void => {
    onSend()
  }

  const handleMax = useCallback(() => {
    if (maxAmount !== undefined) {
      setAmount(maxAmount)
    }
  }, [maxAmount, setAmount])

  useEffect(() => {
    if (!isAddressTouched && toAddress) {
      setIsAddressTouched(true)
    }
  }, [toAddress, isAddressTouched])

  useEffect(() => {
    if (!isTokenTouched && token) {
      setIsTokenTouched(true)
    }
  }, [token, isTokenTouched])

  useEffect(() => {
    if (!isAmountTouched && amount) {
      setIsAmountTouched(true)
    }
  }, [amount, isAmountTouched])

  const isAllFieldsTouched = useMemo(
    () => isAddressTouched && isTokenTouched && isAmountTouched,
    [isAddressTouched, isTokenTouched, isAmountTouched]
  )

  useEffect(() => {
    setCanValidate(isAllFieldsTouched)
  }, [isAllFieldsTouched, setCanValidate])

  const canSubmit = !isSending && isValid && isAllFieldsTouched

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Text variant="heading3" sx={{ marginHorizontal: 16 }}>
        Send
      </Text>
      <Space y={20} />
      <Text
        variant="buttonLarge"
        sx={{ marginHorizontal: 16, marginBottom: -8 }}>
        Send To
      </Text>
      <View style={[{ flex: 0, paddingStart: 4, paddingEnd: 4 }]}>
        <InputText
          testID="send_token__send_field"
          placeholder={addressPlaceholder}
          multiline={true}
          onChangeText={text => {
            setToAddress(text)
          }}
          text={toAddress ?? ''}
        />
        {!toAddress && (
          <View
            style={{
              position: 'absolute',
              right: 64,
              justifyContent: 'center',
              height: '100%'
            }}>
            <AvaButton.Icon onPress={onOpenQRScanner}>
              <QRScanSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      <Space y={24} />
      <>
        <UniversalTokenSelector
          testID="send_token__token_dropdown"
          onTokenChange={tkWithBalance =>
            setToken(tkWithBalance as TokenWithBalance)
          }
          onAmountChange={value => {
            setAmount(value)
          }}
          onMax={toAddress && token ? handleMax : undefined}
          selectedToken={token}
          inputAmount={amount?.bn}
          hideErrorMessage
          error={isAllFieldsTouched && error ? error : undefined}
        />
        {supportsAvalancheDynamicFee && estimatedFee !== undefined && (
          <>
            <Space y={20} />
            <Text
              variant="subtitle1"
              sx={{ marginHorizontal: 16, marginBottom: 6 }}>
              Network Fee
            </Text>
            <View sx={{ marginHorizontal: 16 }}>
              <NetworkFeeSelector
                isDark
                chainId={network.chainId}
                gasLimit={Number(estimatedFee)}
                onFeesChange={handleFeesChange}
                isGasLimitEditable={false}
                supportsAvalancheDynamicFee
              />
            </View>
          </>
        )}

        <FlexSpacer />
      </>
      <AvaButton.PrimaryLarge
        testID={!canSubmit ? 'disabled_next_btn' : 'next_btn'}
        disabled={!canSubmit}
        onPress={handleSend}
        style={{ margin: 16 }}>
        Next
      </AvaButton.PrimaryLarge>
    </ScrollView>
  )
}

export default SendTokenForm
