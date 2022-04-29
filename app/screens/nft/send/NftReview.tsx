import React, { useEffect, useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import DotSVG from 'components/svg/DotSVG'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Avatar from 'components/Avatar'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import AppNavigation from 'navigation/AppNavigation'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import SendRow from 'components/SendRow'
import { useGasPrice } from 'utils/GasPriceHook'
import { useSendNFTContext } from 'contexts/SendNFTContext'
import { useNavigation } from '@react-navigation/native'
import { NFTDetailsSendScreenProps } from 'navigation/types'

type NavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Review
>['navigation']

export type NftReviewScreenProps = {
  onSuccess: (transactionId: string) => void
}

export default function NftReview({ onSuccess }: NftReviewScreenProps) {
  const {
    sendToken: nft,
    sendStatus,
    onSendNow,
    sendStatusMsg,
    toAccount,
    fromAccount,
    fees,
    canSubmit,
    transactionId
  } = useSendNFTContext()
  const { theme } = useApplicationContext()
  const { goBack, navigate } = useNavigation<NavigationProp>()
  const { gasPrice } = useGasPrice()

  const netFeeString = useMemo(() => {
    return fees.sendFeeAvax
      ? Number.parseFloat(fees.sendFeeAvax).toFixed(6)
      : '-'
  }, [fees.sendFeeAvax])

  useEffect(() => {
    switch (sendStatus) {
      case 'Success':
        if (transactionId) {
          onSuccess(transactionId)
        }
    }
  }, [sendStatus, transactionId])

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Send
      </AvaText.LargeTitleBold>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2
        }}>
        <View style={{ position: 'absolute' }}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <Avatar.Custom
          size={56}
          name={nft.collection.contract_name}
          logoUri={nft.external_data.image_256}
        />
      </View>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Collectible
        </AvaText.Body2>
        <Space y={4} />
        <AvaText.Heading1 textStyle={{ alignSelf: 'center' }}>
          #{nft.token_id}
        </AvaText.Heading1>
        <Space y={4} />
        <AvaText.Heading3 textStyle={{ alignSelf: 'center' }}>
          {nft.collection.contract_name}
        </AvaText.Heading3>
        <Space y={18} />
        <SendRow
          label={'From'}
          title={fromAccount.title}
          address={fromAccount.address}
        />
        <Space y={8} />
        <SendRow
          label={'To'}
          title={toAccount.title}
          address={toAccount.address}
        />
        <Space y={8} />
        <NetworkFeeSelector
          networkFeeAvax={netFeeString}
          networkFeeUsd={`${fees.sendFeeUsd?.toFixed(4)} USD`}
          gasPrice={gasPrice}
          onWeightedGas={price => fees.setCustomGasPriceNanoAvax(price.value)}
          weights={{ normal: 1, fast: 1.05, instant: 1.15, custom: 35 }}
          onSettingsPressed={() => {
            const initGasLimit = fees.gasLimit || 0

            const onCustomGasLimit = (gasLimit: number) =>
              fees.setGasLimit(gasLimit)

            navigate(AppNavigation.Modal.EditGasLimit, {
              gasLimit: initGasLimit.toString(),
              networkFee: netFeeString,
              onSave: onCustomGasLimit
            })
          }}
        />
        <Space y={18} />
        <Separator />
        <FlexSpacer />
        {sendStatus !== 'Sending' && (
          <>
            <AvaButton.PrimaryLarge onPress={onSendNow} disabled={!canSubmit}>
              Send Now
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.SecondaryLarge onPress={() => goBack()}>
              Cancel
            </AvaButton.SecondaryLarge>
          </>
        )}
        {sendStatus === 'Sending' && (
          <>
            <ActivityIndicator size="large" color={theme.colorPrimary1} />
            <Space y={32} />
          </>
        )}
        {sendStatus === 'Fail' && (
          <>
            <AvaText.Body2 textStyle={{ color: theme.colorError }}>
              {sendStatusMsg.toString()}
            </AvaText.Body2>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
