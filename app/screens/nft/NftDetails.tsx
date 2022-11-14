import React, { useState } from 'react'
import { Image, ScrollView, StyleSheet, View, Dimensions } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NFTItemData, NFTItemExternalDataAttribute } from 'store/nft'
import { SvgXml } from 'react-native-svg'
import { truncateAddress } from '@avalabs/utils-sdk'
import { isAddress } from '@ethersproject/address'

const imageWidth = Dimensions.get('window').width - 32

export type NftDetailsProps = {
  nft: NFTItemData
  onPicturePressed: (url: string, urlSmall: string, isSvg: boolean) => void
  onSendPressed: (item: NFTItemData) => void
}

export default function NftDetails({
  nft: item,
  onPicturePressed,
  onSendPressed
}: NftDetailsProps) {
  const [imgLoadFailed, setImgLoadFailed] = useState(false)
  const { theme } = useApplicationContext()

  const createdByTxt = isAddress(item.owner)
    ? truncateAddress(item.owner)
    : item.owner

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1>
        {item.name} #{item.tokenId}
      </AvaText.Heading1>
      <AvaButton.Base
        style={{ marginTop: 16, marginBottom: 24 }}
        onPress={() =>
          onPicturePressed(item.image, item.image_256, item.isSvg)
        }>
        {item.isSvg && (
          <View style={{ alignItems: 'center' }}>
            <SvgXml
              xml={item.image}
              width={imageWidth}
              height={imageWidth * item.aspect}
            />
          </View>
        )}
        {!item.isSvg && !imgLoadFailed && (
          <Image
            onError={_ => setImgLoadFailed(true)}
            style={styles.imageStyle}
            width={imageWidth}
            height={imageWidth * item.aspect}
            source={{ uri: item.image }}
          />
        )}
        {imgLoadFailed && (
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
        )}
      </AvaButton.Base>
      <AvaButton.SecondaryLarge onPress={() => onSendPressed(item)}>
        Send
      </AvaButton.SecondaryLarge>
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
      <AvaText.Heading2>Properties</AvaText.Heading2>
      <Space y={8} />
      {renderProps(item.attributes)}
    </ScrollView>
  )
}

const renderProps = (attributes?: NFTItemExternalDataAttribute[]) => {
  if (!attributes) {
    return []
  }
  const props = []
  for (let i = 0; i < attributes.length; i += 2) {
    props.push(
      <View key={i} style={{ marginVertical: 8 }}>
        <Space key={i + 1} y={4} />
        <Row key={i}>
          {attributes[i] && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>
                {(attributes[i] as NFTItemExternalDataAttribute).trait_type}
              </AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3 textStyle={{ marginRight: 16 }}>
                {(attributes[i] as NFTItemExternalDataAttribute).value}
              </AvaText.Heading3>
            </View>
          )}
          {attributes[i + 1] && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>
                {(attributes[i + 1] as NFTItemExternalDataAttribute).trait_type}
              </AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3>
                {(attributes[i + 1] as NFTItemExternalDataAttribute).value}
              </AvaText.Heading3>
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
