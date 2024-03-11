import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, Platform, ScrollView, StyleSheet } from 'react-native'
import { View } from '@avalabs/k2-mobile'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NFTItemExternalDataAttribute } from 'store/nft'
import { SvgXml } from 'react-native-svg'
import { truncateAddress } from '@avalabs/utils-sdk'
import { isAddress } from 'ethers'
import { usePosthogContext } from 'contexts/PosthogContext'
import { isErc1155 } from 'services/nft/utils'
import OvalTagBg from 'components/OvalTagBg'
import { NFTDetailsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Icons, Pressable, useTheme } from '@avalabs/k2-mobile'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import NftService from 'services/nft/NftService'
import { ShowSnackBar } from 'components/Snackbar'
import Loader from 'components/Loader'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import { Tooltip } from 'components/Tooltip'
import NftProcessor from 'services/nft/NftProcessor'
import FastImage from 'react-native-fast-image'
import { useGetNftImageData } from './hooks/useGetNftImageData'
import { useGetNftMetadata } from './hooks/useGetNftMetadata'
import { useNft } from './hooks/useNft'

type NftDetailsScreenProps = NFTDetailsScreenProps<
  typeof AppNavigation.Nft.Details
>

const NftDetailsScreen = (): JSX.Element => {
  const { navigate, setOptions } =
    useNavigation<NftDetailsScreenProps['navigation']>()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { nft: routeNft } = useRoute<NftDetailsScreenProps['route']>().params
  const { nft: freshNft } = useNft(
    activeNetwork.chainId,
    routeNft.address,
    routeNft.tokenId
  )

  const nft = useMemo(() => freshNft ?? routeNft, [freshNft, routeNft])

  const [imgLoadFailed, setImgLoadFailed] = useState(false)
  const { theme } = useApplicationContext()
  const {
    theme: { colors }
  } = useTheme()
  const { sendNftBlockediOS, sendNftBlockedAndroid } = usePosthogContext()
  const createdByTxt = isAddress(nft.owner)
    ? truncateAddress(nft.owner)
    : nft.owner

  const [isReindexing, setIsReindexing] = useState(false)
  const [wasReindexed, setWasReindexed] = useState(false)

  const { getNftMetadata } = useGetNftMetadata()
  const { getNftImageData } = useGetNftImageData()
  const imageData = getNftImageData(nft)
  const metadata = getNftMetadata(nft)

  const canReindex = useMemo(() => {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const reindexBackoff = 3600

    if (!nft || wasReindexed) {
      return false
    }

    const updatedAt = nft.metadata.metadataLastUpdatedTimestamp

    return !updatedAt || currentTimestamp > updatedAt + reindexBackoff
  }, [nft, wasReindexed])

  const renderSendBtn = (): null | JSX.Element => {
    const shouldHide =
      (Platform.OS === 'ios' && sendNftBlockediOS) ||
      (Platform.OS === 'android' && sendNftBlockedAndroid)

    if (shouldHide) return null

    return (
      <AvaButton.SecondaryLarge onPress={handlePressSend}>
        Send
      </AvaButton.SecondaryLarge>
    )
  }

  const handlePressImage = (): void => {
    if (!imageData) {
      return
    }

    navigate(AppNavigation.Nft.FullScreen, { imageData })
  }

  const handlePressSend = (): void => {
    AnalyticsService.capture('CollectibleSendClicked', {
      chainId: nft.chainId
    })
    navigate(AppNavigation.Nft.Send, { nft })
  }

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!nft) {
      return
    }

    setIsReindexing(true)

    try {
      const result = await NftService.reindexNfts(
        nft.address,
        activeNetwork.chainId,
        nft.tokenId
      )

      if (
        nft.address !== result.address ||
        nft.tokenId !== result.tokenId ||
        !result.metadata
      ) {
        return
      }

      const updatedNft = {
        ...nft,
        metadata: {
          ...result.metadata
        }
      }

      NftProcessor.process([updatedNft], true)

      ShowSnackBar(<SnackBarMessage message="NFT refreshed successfully" />)
      setWasReindexed(true)
    } finally {
      setIsReindexing(false)
    }
  }, [activeNetwork, nft])

  const renderHeaderRight = useCallback(() => {
    const disabled = !canReindex || isReindexing

    const refresIcon = (): JSX.Element => (
      <View
        sx={{
          padding: 8,
          paddingRight: 12
        }}>
        <Icons.Navigation.Refresh
          color={disabled ? colors.$neutral700 : colors.$neutral50}
        />
      </View>
    )

    return canReindex ? (
      <Pressable onPress={handleRefresh} disabled={disabled}>
        {refresIcon()}
      </Pressable>
    ) : (
      <Tooltip
        content="Refresh is only available once per hour."
        position="bottom"
        style={{ width: 150 }}
        icon={refresIcon()}
      />
    )
  }, [colors, handleRefresh, canReindex, isReindexing])

  const renderImage = (): JSX.Element => {
    if (imgLoadFailed || !imageData?.image) {
      return renderImageFailure()
    }

    if (!imageData || isReindexing) {
      return renderLoading()
    }

    return (
      <AvaButton.Base onPress={handlePressImage}>
        {imageData.isSvg && (
          <View style={{ alignItems: 'center' }}>
            <SvgXml
              xml={imageData.image ?? null}
              width={imageWidth}
              height={imageWidth * (imageData.aspect ?? 1)}
            />
          </View>
        )}
        {!imageData.isSvg && imageData.image && !imgLoadFailed && (
          <FastImage
            onError={() => setImgLoadFailed(true)}
            style={[
              styles.imageStyle,
              {
                width: imageWidth,
                height: imageWidth * (imageData.aspect ?? 1)
              }
            ]}
            source={{ uri: imageData.image }}
          />
        )}

        {isErc1155(nft) && (
          <OvalTagBg
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              paddingHorizontal: 16,
              paddingVertical: 2,
              height: 24,
              backgroundColor: theme.colorBg3
            }}>
            <AvaText.Body2
              textStyle={{ fontWeight: '600', color: theme.colorText1 }}>
              {nft.balance}
            </AvaText.Body2>
          </OvalTagBg>
        )}
      </AvaButton.Base>
    )
  }

  const renderLoading = (): JSX.Element => {
    return (
      <View
        sx={{
          width: imageWidth,
          height: imageWidth * (imageData?.aspect ?? 1)
        }}>
        <Loader />
      </View>
    )
  }

  const renderImageFailure = (): JSX.Element => {
    return (
      <View
        style={{
          padding: 10,
          justifyContent: 'center'
        }}>
        <AvaText.Heading3
          textStyle={{ color: theme.colorError, textAlign: 'center' }}>
          Could not load image
        </AvaText.Heading3>
      </View>
    )
  }

  useEffect(() => {
    setOptions({
      headerRight: renderHeaderRight
    })
  }, [setOptions, renderHeaderRight])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1 testID="NftTokenTitle">
        {metadata.name} #{nft.tokenId}
      </AvaText.Heading1>
      <View sx={{ marginTop: 16, marginBottom: 24 }}>{renderImage()}</View>
      {renderSendBtn()}
      <Space y={24} />
      <AvaText.Heading2>Description</AvaText.Heading2>
      <Space y={16} />
      <Row>
        <View style={{ flex: 1 }}>
          <AvaText.Body2>Created by</AvaText.Body2>
          <Space y={4} />
          <AvaText.Heading3>{createdByTxt}</AvaText.Heading3>
        </View>
        <View style={{ flex: 1 }}>
          <AvaText.Body2>Floor price</AvaText.Body2>
          <Space y={4} />
          <AvaText.Heading3>Token price not available</AvaText.Heading3>
        </View>
      </Row>
      <Space y={24} />
      {metadata.attributes.length > 0 && (
        <>
          <AvaText.Heading2>Properties</AvaText.Heading2>
          <Space y={8} />
          {renderProps(metadata.attributes)}
        </>
      )}
    </ScrollView>
  )
}

const imageWidth = Dimensions.get('window').width - 32
const renderProps = (
  attributes: NFTItemExternalDataAttribute[]
): JSX.Element[] => {
  const props = []
  for (let i = 0; i < attributes.length; i += 2) {
    const nftAttribute1 = attributes[i]
    const nftAttribute2 = attributes[i + 1]
    if (!nftAttribute1 || !nftAttribute2) {
      continue
    }
    props.push(
      <View key={i} style={{ marginVertical: 8 }}>
        <Space key={i + 1} y={4} />
        <Row key={i}>
          {nftAttribute1 && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>{nftAttribute1.trait_type}</AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3 textStyle={{ marginRight: 16 }}>
                {nftAttribute1.value}
              </AvaText.Heading3>
            </View>
          )}
          {nftAttribute2 && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>{nftAttribute2.trait_type}</AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3>{nftAttribute2.value}</AvaText.Heading3>
            </View>
          )}
        </Row>
      </View>
    )
  }
  return props
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16
  },
  imageStyle: {
    borderRadius: 8,
    resizeMode: 'contain'
  }
})

export default NftDetailsScreen
