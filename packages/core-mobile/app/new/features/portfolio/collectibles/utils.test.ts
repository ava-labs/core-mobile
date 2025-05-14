import { NftItem } from 'services/nft/types'
import { getCollectibleAttributes } from './utils'
import { humanize } from 'utils/string/humanize'

type Collectible = Omit<NftItem, 'processedMetadata'>

const collectible: Partial<Collectible> = {}

// Common type for all test fixtures
type TestCollectible = Partial<Collectible> & {
  processedMetadata: {
    attributes: Record<string, string>[] | Record<string, string>
  }
}

// Create test fixtures with different attribute configurations
const createTestFixture = (
  attributes: Record<string, string>[] | Record<string, string>
): TestCollectible => ({
  ...collectible,
  processedMetadata: { attributes }
})

const collectibleWithEmptyAttributesArray = createTestFixture([])
const collectibleWithEmptyAttributesObject = createTestFixture({})
const collectibleWithAttributesArray = createTestFixture([
  {
    trait_type: 'Trait Type',
    value: 'Value'
  }
])
const collectibleWithAttributesObject = createTestFixture({
  trait_type: 'Value'
})

describe('getCollectibleAttributes', () => {
  it('should return an empty array if the collectible attributes is undefined', () => {
    const attributes = getCollectibleAttributes(
      collectibleWithEmptyAttributesArray as unknown as NftItem
    )
    expect(attributes).toEqual([])
  })

  it('should return an empty array if the collectible attributes is an empty array', () => {
    const attributes = getCollectibleAttributes(
      collectibleWithEmptyAttributesArray as unknown as NftItem
    )
    expect(attributes).toEqual([])
  })

  it('should return an empty array if the collectible attributes is an empty object', () => {
    const attributes = getCollectibleAttributes(
      collectibleWithEmptyAttributesObject as unknown as NftItem
    )
    expect(attributes).toEqual([])
  })

  it('should return the correct attributes for an attribute array', () => {
    const attributes = getCollectibleAttributes(
      collectibleWithAttributesArray as unknown as NftItem
    )
    expect(attributes).toEqual([
      {
        title: 'Trait Type',
        value: 'Value'
      }
    ])
  })

  it('should return the correct attributes for an attribute object', () => {
    const attributes = getCollectibleAttributes(
      collectibleWithAttributesObject as unknown as NftItem
    )
    expect(attributes).toEqual([
      {
        title: humanize('trait_type'),
        value: 'Value'
      }
    ])
  })
})
