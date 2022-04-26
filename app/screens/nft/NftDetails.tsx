import React, { useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { NFTStackParamList } from 'navigation/wallet/NFTScreenStack'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import {
  NFTItemData,
  NFTItemExternalDataAttribute
} from 'screens/nft/NftCollection'
import { Row } from 'components/Row'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'

export type NftDetailsProps = {
  onPicturePressed: (url: string, urlSmall: string) => void
  onSendPressed: (item: NFTItemData) => void
}

export default function NftDetails({
  onPicturePressed,
  onSendPressed
}: NftDetailsProps) {
  const { params } =
    useRoute<RouteProp<NFTStackParamList, typeof AppNavigation.Nft.Details>>()
  const item = useMemo(() => params!.nft, [params]) as NFTItemData
  const [imgLoadFailed, setImgLoadFailed] = useState(false)
  const { theme } = useApplicationContext()

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1>
        {item.collection.contract_name} #{item.token_id}
      </AvaText.Heading1>
      <Space y={24} />
      <AvaButton.Base
        onPress={() =>
          onPicturePressed(
            item.external_data.image,
            item.external_data.image_256
          )
        }>
        {imgLoadFailed ? (
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
        ) : (
          <Image
            onError={_ => setImgLoadFailed(true)}
            style={styles.imageStyle}
            source={{ uri: item.external_data.image_512 }}
          />
        )}
      </AvaButton.Base>
      <Space y={24} />
      <AvaButton.PrimaryLarge onPress={() => onSendPressed(item)}>
        Send
      </AvaButton.PrimaryLarge>
      <Space y={24} />
      <AvaText.Heading2>Description</AvaText.Heading2>
      <Row>
        <View style={{ flex: 1 }}>
          <AvaText.Body2>Created by</AvaText.Body2>
          <AvaText.Body2>{item.external_data.owner}</AvaText.Body2>
        </View>
        <View style={{ flex: 1 }}>
          <AvaText.Body2>Floor price</AvaText.Body2>
          <AvaText.Body2>{item.token_price_wei}</AvaText.Body2>
        </View>
      </Row>
      <Space y={24} />
      <AvaText.Heading2>Properties</AvaText.Heading2>
      <Space y={16} />
      {renderProps(item.external_data.attributes)}
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
      <>
        <Space key={i + 1} y={4} />
        <Row key={i}>
          {attributes[i] && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>{attributes[i].trait_type}</AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3>{attributes[i].value}</AvaText.Heading3>
            </View>
          )}
          {attributes[i + 1] && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>{attributes[i + 1].trait_type}</AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3>{attributes[i + 1].value}</AvaText.Heading3>
            </View>
          )}
        </Row>
      </>
    )
  }
  return props
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16
  },
  imageStyle: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain'
  }
})
