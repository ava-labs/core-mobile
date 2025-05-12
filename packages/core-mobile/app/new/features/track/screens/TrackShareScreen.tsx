import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useRef, useState } from 'react'
import { LayoutChangeEvent, PixelRatio, Platform } from 'react-native'
import {
  ShareChart,
  CHART_IMAGE_SIZE
} from 'features/track/components/ShareChart'
import {
  AvailableSocial,
  ShareFooter
} from 'features/track/components/ShareFooter'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { useTokenDetails } from 'common/hooks/useTokenDetails'
import Share from 'react-native-share'
import * as FileSystem from 'expo-file-system'
import Logger from 'utils/Logger'
import { copyToClipboard } from 'common/utils/clipboard'
import * as SMS from 'expo-sms'
import { CORE_WEB_URL } from 'common/consts'
import { ScrollScreen } from 'common/components/ScrollScreen'

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
  const scale = actualViewWidth ? actualViewWidth / CHART_IMAGE_SIZE : 1
  const cancellingVerticalMargin = actualViewWidth
    ? (CHART_IMAGE_SIZE - actualViewWidth) / 2
    : 0

  const urlToShare = CORE_WEB_URL
  const message = `Don't miss out on ${tokenInfo?.name} price changes. Download Core from the App Store or Google Play store to receive alerts on ${tokenInfo?.name} and other popular tokens. ${urlToShare}`

  const captureImage = async (): Promise<string> => {
    const imageSize = CHART_IMAGE_SIZE / PixelRatio.get()
    return await captureRef(viewShotRef, {
      width: imageSize,
      height: imageSize
    })
  }

  const captureImageInBase64Url = useCallback(async (): Promise<string> => {
    const uri = await captureImage()

    const data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64
    })

    return `data:image/png;base64,${data}`
  }, [])
  const handleMore = useCallback(async (): Promise<void> => {
    const url = await captureImageInBase64Url()

    Share.open({
      url,
      message
    })
  }, [captureImageInBase64Url, message])

  const handleCopyLink = useCallback((link: string | undefined): void => {
    if (link) {
      copyToClipboard(link)
    }
  }, [])

  const handleShare = useCallback(
    async (social: AvailableSocial): Promise<void> => {
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
    },
    [captureImageInBase64Url, message]
  )

  const handleSendMessage = useCallback(async (): Promise<void> => {
    const uri = await captureImage()

    const fileUri =
      Platform.OS === 'ios'
        ? `file://${uri}`
        : await FileSystem.getContentUriAsync(uri)

    await SMS.sendSMSAsync([], message, {
      attachments: {
        uri: fileUri,
        mimeType: 'image/png',
        filename: `${tokenInfo?.name ?? 'token'}.png`
      }
    })
  }, [message, tokenInfo])

  const renderFooter = useCallback(
    () => (
      <ShareFooter
        url={urlToShare}
        onSendMessage={handleSendMessage}
        onMore={handleMore}
        onCopyLink={handleCopyLink}
        onShare={handleShare}
      />
    ),
    [urlToShare, handleSendMessage, handleMore, handleCopyLink, handleShare]
  )

  if (!tokenId || !token) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <ScrollScreen
      onLayout={handleLayout}
      contentContainerStyle={{ paddingBottom: 60 }}
      renderFooter={renderFooter}>
      {actualViewWidth !== undefined && (
        <>
          <View
            sx={{
              transform: [{ scale: scale }],
              alignItems: 'center',
              marginTop: -cancellingVerticalMargin
            }}>
            <View
              sx={{
                borderRadius: 18 / scale,
                borderWidth: 1,
                borderColor: theme.colors.$borderPrimary,
                overflow: 'hidden'
              }}>
              <ViewShot ref={viewShotRef}>
                <ShareChart tokenId={tokenId} />
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
    </ScrollScreen>
  )
}

export default ShareMarketTokenScreen
