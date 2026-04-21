import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import { isUnreachableNftIndexStatus } from './indexStatus'

describe('app/services/nft/indexStatus', () => {
  describe('isUnreachableNftIndexStatus', () => {
    it('returns true for UNREACHABLE_TOKEN_URI', () => {
      expect(
        isUnreachableNftIndexStatus(
          NftTokenMetadataStatus.UNREACHABLE_TOKEN_URI
        )
      ).toBe(true)
    })

    it('returns true for INVALID_TOKEN_URI_SCHEME', () => {
      expect(
        isUnreachableNftIndexStatus(
          NftTokenMetadataStatus.INVALID_TOKEN_URI_SCHEME
        )
      ).toBe(true)
    })

    it.each([
      NftTokenMetadataStatus.INDEXED,
      NftTokenMetadataStatus.UNINDEXED,
      NftTokenMetadataStatus.UNKNOWN,
      NftTokenMetadataStatus.MISSING_TOKEN,
      NftTokenMetadataStatus.INVALID_TOKEN_URI,
      NftTokenMetadataStatus.THROTTLED_TOKEN_URI,
      NftTokenMetadataStatus.METADATA_CONTENT_TOO_LARGE,
      NftTokenMetadataStatus.INVALID_METADATA,
      NftTokenMetadataStatus.INVALID_METADATA_JSON
    ])(
      'returns false for transient / re-indexable status %s',
      (status: NftTokenMetadataStatus) => {
        expect(isUnreachableNftIndexStatus(status)).toBe(false)
      }
    )

    it('returns false when status is undefined', () => {
      expect(isUnreachableNftIndexStatus(undefined)).toBe(false)
    })
  })
})
