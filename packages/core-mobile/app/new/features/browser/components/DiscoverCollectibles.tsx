import { AnimatedPressable, Button, Text } from '@avalabs/k2-alpine'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { CardContainer } from 'features/portfolio/collectibles/components/CardContainer'
import React from 'react'
import { View } from 'react-native'
import { HORIZONTAL_MARGIN } from '../consts'
import NftCollectionImage from '../../../assets/nft-collection.png'

export const DiscoverCollectibles = (): JSX.Element => {
  const { navigate } = useRouter()

  const openDiscoverCollectibles = (): void => {
    navigate('/discoverCollectibles')
  }

  return (
    <AnimatedPressable
      style={{
        paddingHorizontal: HORIZONTAL_MARGIN,
        marginTop: 16,
        marginBottom: 36
      }}
      onPress={openDiscoverCollectibles}>
      <CardContainer
        style={{
          paddingHorizontal: 22,
          paddingVertical: 26,
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          height: 'auto',
          gap: 12
        }}>
        <View
          style={{
            gap: 2
          }}>
          <Text variant="heading5">{`Build your\nNFT collection`}</Text>
          <Text variant="subtitle2">
            {"Find digital artworks\nyou'd like to own"}
          </Text>
        </View>

        <View>
          <Button
            type="secondary"
            size="small"
            onPress={openDiscoverCollectibles}>
            Browse
          </Button>
        </View>

        <Image
          style={{
            position: 'absolute',
            right: 14,
            top: 30,
            width: 180,
            height: 188
          }}
          renderToHardwareTextureAndroid={false}
          contentFit="contain"
          source={NftCollectionImage}
        />
      </CardContainer>
    </AnimatedPressable>
  )
}
