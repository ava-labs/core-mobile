import React, { useState } from 'react'
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NFTItemData, NFTItemExternalDataAttribute } from 'store/nft'
import { SvgXml } from 'react-native-svg'
import { truncateAddress } from '@avalabs/utils-sdk'
import { isAddress } from 'ethers'
import { usePosthogContext } from 'contexts/PosthogContext'
import { isErc1155 } from 'services/nft/utils'
import OvalTagBg from 'components/OvalTagBg'

const imageWidth = Dimensions.get('window').width - 32

export type NftDetailsProps = {
  nft: NFTItemData
  onPicturePressed: (url: string, isSvg: boolean) => void
  onSendPressed: (item: NFTItemData) => void
}

export default function NftDetails({
  nft: item,
  onPicturePressed,
  onSendPressed
}: NftDetailsProps): JSX.Element {
  const [imgLoadFailed, setImgLoadFailed] = useState(false)
  const { theme } = useApplicationContext()
  const { sendNftBlockediOS, sendNftBlockedAndroid } = usePosthogContext()
  const createdByTxt = isAddress(item.owner)
    ? truncateAddress(item.owner)
    : item.owner

  const renderSendBtn = (): null | JSX.Element => {
    const shouldHide =
      (Platform.OS === 'ios' && sendNftBlockediOS) ||
      (Platform.OS === 'android' && sendNftBlockedAndroid)

    if (shouldHide) return null

    return (
      <AvaButton.SecondaryLarge onPress={() => onSendPressed(item)}>
        Send
      </AvaButton.SecondaryLarge>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1 testID="NftTokenTitle">
        {item.metadata.name} #{item.tokenId}
      </AvaText.Heading1>
      <AvaButton.Base
        style={{ marginTop: 16, marginBottom: 24 }}
        onPress={() => {
          if (!item.metadata.imageUri) {
            return
          }
          onPicturePressed(item.metadata.imageUri, item.isSvg)
        }}>
        {item.isSvg && (
          <View style={{ alignItems: 'center' }}>
            <SvgXml
              xml={item.metadata.imageUri ?? null}
              width={imageWidth}
              height={imageWidth * (item.aspect ?? 1)}
            />
          </View>
        )}
        {!item.isSvg && item.metadata.imageUri && !imgLoadFailed && (
          <Image
            onError={_ => setImgLoadFailed(true)}
            style={styles.imageStyle}
            width={imageWidth}
            height={imageWidth * (item.aspect ?? 1)}
            source={{ uri: item.metadata.imageUri }}
          />
        )}
        {(imgLoadFailed || !item.metadata.imageUri) && (
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

        {isErc1155(item) && (
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
              {item.balance}
            </AvaText.Body2>
          </OvalTagBg>
        )}
      </AvaButton.Base>
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
      <AvaText.Heading2>Properties</AvaText.Heading2>
      <Space y={8} />
      {renderProps(item.attributes)}
    </ScrollView>
  )
}

const renderProps = (
  attributes?: NFTItemExternalDataAttribute[]
): JSX.Element[] => {
  if (!attributes) {
    return []
  }
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
