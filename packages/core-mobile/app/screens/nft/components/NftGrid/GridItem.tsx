import React, { useState } from 'react'
import { Animated, Dimensions, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity15 } from 'resources/Constants'
import AvaText from 'components/AvaText'
import { SvgXml } from 'react-native-svg'
import OvalTagBg from 'components/OvalTagBg'
import { getNftImage, getNftTitle, isErc1155 } from 'services/nft/utils'
import { Image } from 'expo-image'
import { NftItem } from 'services/nft/types'

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

export const GridItem = ({
  item,
  onItemSelected,
  testID
}: {
  item: NftItem
  onItemSelected: (item: NftItem) => void
  testID?: string
}): JSX.Element => {
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
    const name = getNftTitle(item)
    return <ErrorFallback title={`#${item.tokenId}`} subtitle={name} />
  }

  const renderImage = (): JSX.Element => {
    const imageUri = getNftImage(item)

    if (imgLoadFailed || !imageUri) {
      return renderFallback()
    }

    const imageHeight = GRID_ITEM_WIDTH * (item.imageData?.aspect ?? 1)

    return item.imageData?.isSvg ? (
      <SvgXml
        xml={item.imageData.image ?? null}
        width={GRID_ITEM_WIDTH}
        height={imageHeight}
      />
    ) : (
      <Animated.View style={{ opacity: opacity }}>
        <Image
          style={{
            width: GRID_ITEM_WIDTH,
            height: imageHeight,
            borderRadius: 8
          }}
          source={{ uri: imageUri }}
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
      testID={testID}>
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
            {item.balance.toString()}
          </AvaText.Body3>
        </OvalTagBg>
      )}
    </AvaButton.Base>
  )
}
