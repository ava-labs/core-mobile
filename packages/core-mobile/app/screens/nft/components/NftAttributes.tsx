import React from 'react'
import { View } from '@avalabs/k2-mobile'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { NftItemExternalDataAttribute } from 'services/nft/types'

const NftAttributes = ({
  attributes
}: {
  attributes: NftItemExternalDataAttribute[]
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
          {nftAttribute1.value !== '' && (
            <View style={{ flex: 1 }}>
              <AvaText.Body2>{nftAttribute1.trait_type}</AvaText.Body2>
              <Space y={4} />
              <AvaText.Heading3 textStyle={{ marginRight: 16 }}>
                {nftAttribute1.value}
              </AvaText.Heading3>
            </View>
          )}
          {nftAttribute2.value !== '' && (
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
