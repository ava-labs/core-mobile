import { ScrollView, Text, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Content, CONTENT_SIZE } from 'features/track/components/Content'
import { ShareFooter } from 'features/track/components/ShareFooter'
import ViewShot from 'react-native-view-shot'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import Share from 'react-native-share'
import * as FileSystem from 'expo-file-system'

const ShareMarketTokenScreen = (): JSX.Element => {
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

  const handleMore = (): void => {
    viewShotRef.current?.capture?.().then(async uri => {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      })

      Share.open({
        title: tokenInfo?.urlHostname,
        url: `data:image/png;base64,${base64}`
      })
    })
  }

  if (!tokenId || !token) {
    return <LoadingState />
  }

  return (
    <View sx={{ flex: 1 }} onLayout={handleLayout}>
      <ScrollView sx={{ flex: 1 }} contentContainerSx={{ paddingBottom: 60 }}>
        <View
          sx={{
            transform: [{ scale: scale }],
            alignItems: 'center',
            marginTop: -cancellingVerticalMargin + 30
          }}>
          <ViewShot ref={viewShotRef}>
            <Content tokenId={tokenId} scale={scale} />
          </ViewShot>
        </View>
        <View
          sx={{
            marginTop: -cancellingVerticalMargin + 26,
            marginHorizontal: 33
          }}>
          <Text variant="body1" sx={{ color: '$textSecondary' }}>
            Keep track of any AVAX price changes with Core. Customize push
            notifications lorem ipsum dolor sit amet lorem ipsum dolor
          </Text>
        </View>
      </ScrollView>
      <ShareFooter onMore={handleMore} />
    </View>
  )
}

export default ShareMarketTokenScreen
