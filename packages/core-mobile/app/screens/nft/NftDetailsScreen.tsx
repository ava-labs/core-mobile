import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, Platform, ScrollView, StyleSheet } from 'react-native'
import { View } from '@avalabs/k2-mobile'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { SvgXml } from 'react-native-svg'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { isAddress } from 'ethers'
import { usePosthogContext } from 'contexts/PosthogContext'
import { getNftTitle, isErc1155 } from 'services/nft/utils'
import OvalTagBg from 'components/OvalTagBg'
import { NFTDetailsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Icons, Pressable, useTheme } from '@avalabs/k2-mobile'
import Loader from 'components/Loader'
import { Tooltip } from 'components/Tooltip'
import { Image } from 'expo-image'
import { useNftItemsContext } from 'contexts/NftItemsContext'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isAvalancheNetwork } from 'services/network/utils/isAvalancheNetwork'
import NftAttributes from './components/NftAttributes'

type NftDetailsScreenProps = NFTDetailsScreenProps<
  typeof AppNavigation.Nft.Details
>

const NftDetailsScreen = (): JSX.Element | null => {
  const { navigate, setOptions } =
    useNavigation<NftDetailsScreenProps['navigation']>()
  const { activeNetwork } = useNetworks()
  const { localId } = useRoute<NftDetailsScreenProps['route']>().params

  const { getNftItem, refreshNftMetadata, isNftRefreshing } =
    useNftItemsContext()

  const nftItem = getNftItem(localId)

  const isRefreshing = useMemo(() => {
    if (!nftItem) return false

    return isNftRefreshing(nftItem.localId)
  }, [isNftRefreshing, nftItem])

  const [imgLoadFailed, setImgLoadFailed] = useState(false)
  const { theme } = useApplicationContext()
  const {
    theme: { colors }
  } = useTheme()
  const { sendNftBlockediOS, sendNftBlockedAndroid } = usePosthogContext()

  const canRefreshMetadata = useMemo(() => {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const refreshBackoff = 3600

    const updatedAt = nftItem?.metadata?.lastUpdatedTimestamp

    return !updatedAt || currentTimestamp > updatedAt + refreshBackoff
  }, [nftItem])

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!nftItem) {
      return
    }

    await refreshNftMetadata(nftItem, activeNetwork.chainId)
  }, [activeNetwork.chainId, refreshNftMetadata, nftItem])

  const renderHeaderRight = useCallback(() => {
    const disabled = !canRefreshMetadata || isRefreshing
    const refreshIcon = (
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

    return canRefreshMetadata ? (
      <Pressable onPress={handleRefresh} disabled={disabled}>
        {refreshIcon}
      </Pressable>
    ) : (
      <Tooltip
        content="Refresh is only available once per hour."
        position="bottom"
        style={{ width: 150 }}
        icon={refreshIcon}
      />
    )
  }, [colors, handleRefresh, canRefreshMetadata, isRefreshing])

  useEffect(() => {
    // glacier reindexing only applies to Avalanche NFTs only
    if (isAvalancheNetwork(activeNetwork)) {
      setOptions({
        headerRight: renderHeaderRight
      })
    }
  }, [setOptions, renderHeaderRight, activeNetwork])

  if (!nftItem) return null

  const createdByTxt = isAddress(nftItem.address)
    ? truncateAddress(nftItem?.address)
    : nftItem.address

  const renderSendBtn = (): null | JSX.Element => {
    const shouldHide =
      (Platform.OS === 'ios' && sendNftBlockediOS) ||
      (Platform.OS === 'android' && sendNftBlockedAndroid)

    if (shouldHide) return null

    return (
      <AvaButton.SecondaryLarge onPress={handlePressSend} testID="send_btn">
        Send
      </AvaButton.SecondaryLarge>
    )
  }

  const handlePressImage = (): void => {
    if (!nftItem.imageData) {
      return
    }

    navigate(AppNavigation.Nft.FullScreen, { imageData: nftItem.imageData })
  }

  const handlePressSend = (): void => {
    AnalyticsService.capture('CollectibleSendClicked', {
      chainId: activeNetwork.chainId.toString()
    })
    navigate(AppNavigation.Nft.Send, { nft: nftItem })
  }

  const shouldRenderImage =
    !nftItem.imageData?.isSvg && nftItem.imageData?.image && !imgLoadFailed

  const renderImage = (): JSX.Element => {
    if (imgLoadFailed || !nftItem.imageData?.image) {
      return renderImageFailure()
    }

    if (!nftItem.imageData || isRefreshing) {
      return renderLoading()
    }

    return (
      <AvaButton.Base onPress={handlePressImage}>
        {nftItem.imageData.isSvg && (
          <View style={{ alignItems: 'center' }}>
            <SvgXml
              xml={nftItem.imageData.image ?? null}
              width={imageWidth}
              height={imageWidth * (nftItem.imageData.aspect ?? 1)}
            />
          </View>
        )}
        {shouldRenderImage && (
          <Image
            onError={() => setImgLoadFailed(true)}
            style={[
              styles.imageStyle,
              {
                width: imageWidth,
                height: imageWidth * (nftItem.imageData.aspect ?? 1)
              }
            ]}
            source={{ uri: nftItem.imageData.image }}
          />
        )}

        {isErc1155(nftItem) && (
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
              {nftItem.balance.toString()}
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
          height: imageWidth * (nftItem.imageData?.aspect ?? 1)
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1 testID="NftTokenTitle">
        {getNftTitle(nftItem)}
      </AvaText.Heading1>
      <View sx={{ marginTop: 16, marginBottom: 24 }}>{renderImage()}</View>
      {renderSendBtn()}
      <Space y={24} />
      <AvaText.Heading2>Description</AvaText.Heading2>
      <Space y={16} />
      {nftItem.collectionName && (
        <>
          <View style={{ flex: 1 }}>
            <AvaText.Body2>Collection</AvaText.Body2>
            <Space y={4} />
            <AvaText.Heading3>{nftItem.collectionName}</AvaText.Heading3>
          </View>
          <Space y={16} />
        </>
      )}
      {nftItem.processedMetadata?.description && (
        <>
          <View style={{ flex: 1 }}>
            <AvaText.Body2>Description</AvaText.Body2>
            <Space y={4} />
            <AvaText.Heading3>
              {nftItem.processedMetadata.description.trim()}
            </AvaText.Heading3>
          </View>
          <Space y={16} />
        </>
      )}
      <View style={{ flex: 1 }}>
        <AvaText.Body2>Created by</AvaText.Body2>
        <Space y={4} />
        <AvaText.Heading3>{createdByTxt}</AvaText.Heading3>
      </View>
      <Space y={24} />
      {nftItem.processedMetadata?.attributes &&
        nftItem.processedMetadata?.attributes.length > 0 && (
          <>
            <AvaText.Heading2>Properties</AvaText.Heading2>
            <Space y={8} />
            <NftAttributes attributes={nftItem.processedMetadata.attributes} />
          </>
        )}
    </ScrollView>
  )
}

const imageWidth = Dimensions.get('window').width - 32

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
