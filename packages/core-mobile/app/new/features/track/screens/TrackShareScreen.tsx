import { SCREEN_WIDTH, Text, useTheme, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { CORE_WEB_URL } from 'common/consts'
import { copyToClipboard } from 'common/utils/clipboard'
import * as FileSystem from 'expo-file-system'
import { useLocalSearchParams } from 'expo-router'
import * as SMS from 'expo-sms'
import {
  CHART_IMAGE_SIZE,
  ShareChart
} from 'features/track/components/ShareChart'
import {
  AvailableSocial,
  ShareFooter
} from 'features/track/components/ShareFooter'
import React, { useCallback, useRef } from 'react'
import { PixelRatio, Platform } from 'react-native'
import Share from 'react-native-share'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { MarketToken } from 'store/watchlist/types'
import Logger from 'utils/Logger'

const ShareMarketTokenScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const params = useLocalSearchParams<{
    token: string
  }>()

  const token = JSON.parse(params.token) as MarketToken

  const viewShotRef = useRef<ViewShot>(null)

  const actualViewWidth = SCREEN_WIDTH - 60
  const scale = actualViewWidth ? actualViewWidth / CHART_IMAGE_SIZE : 1
  const cancellingVerticalMargin = actualViewWidth
    ? (CHART_IMAGE_SIZE - actualViewWidth) / 2
    : 0

  const urlToShare = CORE_WEB_URL
  const message = `Don't miss out on ${token?.name} price changes. Download Core from the App Store or Google Play store to receive alerts on ${token?.name} and other popular tokens. ${urlToShare}`

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
        filename: `${token?.name ?? 'token'}.png`
      }
    })
  }, [message, token?.name])

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

  if (!token.id) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <ScrollScreen renderFooter={renderFooter}>
      {actualViewWidth !== undefined && (
        <>
          <View
            sx={{
              transform: [{ scale: scale }],
              alignItems: 'center',
              marginTop: -cancellingVerticalMargin + 34
            }}>
            <View
              sx={{
                borderRadius: 18 / scale,
                borderWidth: 1,
                backgroundColor: theme.colors.$surfacePrimary,
                borderColor: theme.colors.$borderPrimary,
                overflow: 'hidden'
              }}>
              <ViewShot ref={viewShotRef}>
                <ShareChart token={token} />
              </ViewShot>
            </View>
          </View>
          <View
            sx={{
              marginTop: -cancellingVerticalMargin + 26,
              marginHorizontal: 33
            }}>
            <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
              {message}
            </Text>
          </View>
        </>
      )}
    </ScrollScreen>
  )
}

export default ShareMarketTokenScreen
