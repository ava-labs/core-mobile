import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Text, Button } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { selectActiveAccount } from 'store/account'
import { SvgXml } from 'react-native-svg'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NFTDetailsSendScreenProps } from 'navigation/types'
import useEVMSend from 'screens/send/hooks/useEVMSend'
import { useSelector } from 'react-redux'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { useSendContext } from 'contexts/SendContext'
import QRScanSVG from 'components/svg/QRScanSVG'
import { useNativeTokenWithBalance } from 'screens/send/hooks/useNativeTokenWithBalance'
import { getNftTitle } from 'services/nft/utils'
import { NftItem } from 'services/nft/types'

type NftSendScreenProps = {
  onOpenQRScanner: () => void
}

type NftSendNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Send
>

export default function NftSend({
  onOpenQRScanner
}: NftSendScreenProps): JSX.Element {
  const navigation = useNavigation<NftSendNavigationProp['navigation']>()
  const { params } = useRoute<NftSendNavigationProp['route']>()
  const {
    token,
    toAddress,
    setToAddress,
    maxFee,
    error,
    isSending,
    isValid,
    setCanValidate
  } = useSendContext()
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const fromAddress = activeAccount?.addressC ?? ''
  const nativeToken = useNativeTokenWithBalance()
  const [touched, setTouched] = useState(false)

  const { send } = useEVMSend({
    chainId: activeNetwork.chainId,
    fromAddress,
    network: activeNetwork,
    maxFee,
    nativeToken
  })

  const canSubmit =
    !isSending && isValid && !!toAddress && error === undefined && touched

  const onNextPress = async (): Promise<void> => {
    if (token === undefined || toAddress === undefined) {
      return
    }

    try {
      await send()

      AnalyticsService.capture('NftSendSucceeded', {
        chainId: activeNetwork.chainId
      })

      audioFeedback(Audios.Send)

      navigation.navigate(AppNavigation.Wallet.Drawer, {
        screen: AppNavigation.Wallet.Tabs,
        params: {
          screen: AppNavigation.Tabs.Portfolio,
          params: {}
        }
      })
    } catch (reason) {
      if (reason instanceof Error && !isUserRejectedError(reason)) {
        showTransactionErrorToast({
          message: getJsonRpcErrorMessage(reason)
        })
        AnalyticsService.capture('NftSendFailed', {
          errorMessage: reason?.message,
          chainId: activeNetwork.chainId
        })
      }
    }
  }

  useEffect(() => {
    if (touched === false && toAddress) {
      setTouched(true)
    }
  }, [toAddress, touched, setCanValidate])

  useEffect(() => {
    setCanValidate(touched)
  }, [touched, setCanValidate])

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text variant="heading3">Send</Text>
      <Space y={20} />
      <Text variant="heading6">Send To</Text>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          placeholder={'Enter 0x Address'}
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
      <>
        <Text variant="heading6">Collectible</Text>
        <CollectibleItem nft={params.nft} />
        <Text variant="body1" sx={{ color: '$dangerMain' }}>
          {touched && error ? error : ''}
        </Text>
        <FlexSpacer />
      </>
      <Button
        testID={canSubmit ? 'next_btn' : 'next_btn_disabled'}
        type="primary"
        size="xlarge"
        onPress={onNextPress}
        disabled={!canSubmit}
        style={{ marginBottom: 16 }}>
        Next
      </Button>
    </ScrollView>
  )
}

const CollectibleItem = ({ nft }: { nft: NftItem }): JSX.Element => {
  const { theme } = useApplicationContext()
  const width = 80
  const height = 80 * (nft.imageData?.aspect ?? 1)
  return (
    <View
      style={[
        styles.collectibleItem,
        {
          backgroundColor: theme.colorBg2
        }
      ]}>
      <Row>
        {nft.imageData?.isSvg ? (
          <View style={{ borderRadius: 8, alignItems: 'center' }}>
            <SvgXml
              xml={nft.imageData?.image ?? null}
              width={width}
              height={height}
            />
          </View>
        ) : (
          <Image
            style={[styles.nftImage, { width, height: height }]}
            source={{ uri: nft.imageData?.image }}
          />
        )}
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <Text
            variant="heading5"
            testID="NftTokenID"
            numberOfLines={1}
            ellipsizeMode="tail">
            #{nft.tokenId}
          </Text>
          <Text
            variant="heading6"
            testID="NftTokenName"
            numberOfLines={1}
            ellipsizeMode="tail">
            {getNftTitle(nft)}
          </Text>
        </View>
      </Row>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    minHeight: '100%'
  },
  collectibleItem: {
    marginVertical: 16,
    borderRadius: 8,
    padding: 16
  },
  nftImage: {
    borderRadius: 8,
    resizeMode: 'contain'
  }
})
