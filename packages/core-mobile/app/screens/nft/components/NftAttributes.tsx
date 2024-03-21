import React from 'react'
import { View } from '@avalabs/k2-mobile'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { NFTItemExternalDataAttribute } from 'store/nft'
import AvaText from 'components/AvaText'

const NftAttributes = ({
  attributes
}: {
  attributes: NFTItemExternalDataAttribute[]
}): JSX.Element => {
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

  return <>{props}</>
}

export default NftAttributes
