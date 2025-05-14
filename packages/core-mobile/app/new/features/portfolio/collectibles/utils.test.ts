import { NftItem } from 'services/nft/types'
import { getCollectibleAttributes } from './utils'

const mockedCollectible: Partial<NftItem> = {
  name: 'Test Collectible',
  description: 'Test Description',
  processedMetadata: {
    name: 'Test Collectible',
    description: 'Test Description',
    image: 'https://test.com/image.png',
    image_256: 'https://test.com/image_256.png',
    external_url: 'https://test.com',
    animation_url: 'https://test.com/animation.mp4',
    attributes: [
      {
        trait_type: 'Test Attribute',
        value: 'Test Value',
        display_type: '',
        percentOwned: 0
      }
    ]
  }
}
const mockedCollectibleWithObjectAttributes: Partial<
  Omit<NftItem, 'processedMetadata'> & {
    processedMetadata: {
      attributes: {
        trait_type: string
        value: string
      }
    }
  }
> = {
  name: 'Test Collectible',
  description: 'Test Description',
  processedMetadata: {
    attributes: {
      trait_type: 'Test Attribute',
      value: 'Test Value'
    }
  }
}

describe('getCollectibleAttributes', () => {
  it('should return an empty array if the collectible has no attributes', () => {
    const attributes = getCollectibleAttributes(mockedCollectible as NftItem)
    expect(attributes).toEqual([])
  })

  it('should return the correct attributes for an attribute array', () => {
    const attributes = getCollectibleAttributes(mockedCollectible as NftItem)
    expect(attributes).toEqual([
      {
        title: 'Test Attribute',
        value: 'Test Value'
      }
    ])
  })

  it('should return the correct attributes for an attribute object', () => {
    const attributes = getCollectibleAttributes(
      mockedCollectibleWithObjectAttributes as NftItem
    )
    expect(attributes).toEqual([
      {
        title: 'Test Attribute',
        value: 'Test Value'
      }
    ])
  })
})
