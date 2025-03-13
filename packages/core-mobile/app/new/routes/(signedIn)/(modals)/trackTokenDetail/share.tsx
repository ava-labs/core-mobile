import { ScrollView, Text, useTheme, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useRef, useState } from 'react'
import { LayoutChangeEvent, PixelRatio } from 'react-native'
import { Content, CONTENT_SIZE } from 'features/track/components/Content'
import {
  AvailableSocial,
  ShareFooter
} from 'features/track/components/ShareFooter'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import Share from 'react-native-share'
import * as FileSystem from 'expo-file-system'
import Logger from 'utils/Logger'
import { copyToClipboard } from 'common/utils/clipboard'

const ShareMarketTokenScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>()
  const { getMarketTokenById } = useWatchlist()
  const token = tokenId ? getMarketTokenById(tokenId) : undefined
  const [viewWidth, setViewWidth] = useState<number>()
  const viewShotRef = useRef<ViewShot>(null)
  const { tokenInfo } = useTokenDetails(tokenId ?? '')

  const handleLayout = (event: LayoutChangeEvent): void => {
    setViewWidth(event.nativeEvent.layout.width)
  }

  const actualViewWidth = viewWidth ? viewWidth - 60 : undefined
  const scale = actualViewWidth ? actualViewWidth / CONTENT_SIZE : 1
  const cancellingVerticalMargin = actualViewWidth
    ? (CONTENT_SIZE - actualViewWidth) / 2
    : 0

  const urlToShare = tokenInfo?.urlHostname
  const message = `Don't miss out on ${tokenInfo?.name} price changes. Download Core from the App Store or Google Play store to receive alerts on ${tokenInfo?.name} and other popular tokens.`

  const handleMore = async (): Promise<void> => {
    const url = await captureImageInBase64Url()

    Share.open({
      url,
      message
    })
  }

  const handleCopyLink = (link: string | undefined): void => {
    if (link) {
      copyToClipboard(link)
    }
  }

  const handleShare = async (social: AvailableSocial): Promise<void> => {
    try {
      const url = await captureImageInBase64Url()

      await Share.shareSingle({
        message,
        url,
        social
      })
    } catch (error) {
      Logger.error('Error sharing', error)
    }
  }

  const captureImage = async (): Promise<string> => {
    const imageSize = CONTENT_SIZE / PixelRatio.get()
    return await captureRef(viewShotRef, {
      width: imageSize,
      height: imageSize
    })
  }

  const captureImageInBase64Url = async (): Promise<string> => {
    const uri = await captureImage()

    const data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64
    })

    return `data:image/png;base64,${data.replace(/(\r\n|\n|\r)/gm, '')}`
  }

  if (!tokenId || !token) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <View sx={{ flex: 1 }} onLayout={handleLayout}>
      <ScrollView sx={{ flex: 1 }} contentContainerSx={{ paddingBottom: 60 }}>
        {actualViewWidth !== undefined && (
          <>
            <View
              sx={{
                transform: [{ scale: scale }],
                alignItems: 'center',
                marginTop: -cancellingVerticalMargin + 30
              }}>
              <View
                sx={{
                  borderRadius: 18 / scale,
                  borderWidth: 1,
                  borderColor: theme.colors.$borderPrimary,
                  overflow: 'hidden'
                }}>
                <ViewShot ref={viewShotRef}>
                  <Content tokenId={tokenId} />
                </ViewShot>
              </View>
            </View>
            <View
              sx={{
                marginTop: -cancellingVerticalMargin + 26,
                marginHorizontal: 33
              }}>
              <Text variant="body1" sx={{ color: '$textSecondary' }}>
                {message}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <ShareFooter
        url={urlToShare}
        onMore={handleMore}
        onCopyLink={handleCopyLink}
        onShare={handleShare}
      />
    </View>
  )
}

export default ShareMarketTokenScreen
