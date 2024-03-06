import React, { useState } from 'react'
import { Animated, Dimensions, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity15 } from 'resources/Constants'
import AvaText from 'components/AvaText'
import { NFTImageData, NFTItemData, NFTMetadata } from 'store/nft'
import { SvgXml } from 'react-native-svg'
import OvalTagBg from 'components/OvalTagBg'
import { isErc1155 } from 'services/nft/utils'
import FastImage from 'react-native-fast-image'

const SCREEN_WIDTH = Dimensions.get('window')?.width
const GRID_ITEM_MARGIN = 8
const PARENT_PADDING = 16
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_ITEM_MARGIN * 4 - PARENT_PADDING * 2) / 2

const ErrorFallback = ({
  title,
  subtitle
}: {
  title: string
  subtitle?: string
}): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={{
        backgroundColor: theme.colorPrimary1 + Opacity15,
        padding: 10,
        borderRadius: 8,
        width: GRID_ITEM_WIDTH,
        height: GRID_ITEM_WIDTH,
        justifyContent: 'center'
      }}>
      <AvaText.Heading2 ellipsizeMode={'tail'}>{title}</AvaText.Heading2>
      <AvaText.Body2 ellipsizeMode={'tail'}>{subtitle}</AvaText.Body2>
    </View>
  )
}

export const GridItem = React.memo(
  ({
    item,
    metadata,
    imageData,
    onItemSelected
  }: {
    item: NFTItemData
    metadata: NFTMetadata
    onItemSelected: (item: NFTItemData) => void
    imageData?: NFTImageData
  }) => {
    const [imgLoadFailed, setImgLoadFailed] = useState(false)
    const theme = useApplicationContext().theme
    const [opacity] = useState(new Animated.Value(0))

    const handleFadeIn = (): void => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start()
    }

    const renderFallback = (): JSX.Element => {
      return (
        <ErrorFallback title={`#${item.tokenId}`} subtitle={metadata.name} />
      )
    }

    const renderImage = (): JSX.Element => {
      if (imgLoadFailed) {
        return renderFallback()
      }

      if (!imageData) {
        if (metadata.imageUri) {
          return (
            <View style={{ width: GRID_ITEM_WIDTH, height: GRID_ITEM_WIDTH }} />
          )
        } else {
          return renderFallback()
        }
      }

      return imageData.isSvg ? (
        <SvgXml
          xml={imageData.image ?? null}
          width={GRID_ITEM_WIDTH}
          height={GRID_ITEM_WIDTH * (imageData.aspect ?? 1)}
        />
      ) : (
        <Animated.View style={{ opacity: opacity }}>
          <FastImage
            style={{
              width: GRID_ITEM_WIDTH,
              height: GRID_ITEM_WIDTH * (imageData.aspect ?? 1),
              borderRadius: 8
            }}
            source={{ uri: imageData.image }}
            onLoadEnd={handleFadeIn}
            onError={() => {
              setImgLoadFailed(true)
            }}
          />
        </Animated.View>
      )
    }

    return (
      <AvaButton.Base
        onPress={() => onItemSelected(item)}
        style={{
          margin: GRID_ITEM_MARGIN
        }}
        testID="baseGridItem">
        {renderImage()}
        {isErc1155(item) && (
          <OvalTagBg
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              paddingHorizontal: 12,
              paddingVertical: 0,
              height: 20,
              backgroundColor: theme.colorBg3
            }}>
            <AvaText.Body3
              textStyle={{
                lineHeight: 20,
                fontWeight: '600',
                color: theme.colorText1
              }}>
              {item.balance}
            </AvaText.Body3>
          </OvalTagBg>
        )}
      </AvaButton.Base>
    )
  }
)
