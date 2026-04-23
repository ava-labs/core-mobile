import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'

/**
 * Glacier index statuses that indicate a collectible is "unreachable".
 *
 * Kept in sync with extension and web Core, which treat only these two
 * statuses as terminal for display purposes:
 *   - UNREACHABLE_TOKEN_URI: indexer could not fetch the tokenUri
 *   - INVALID_TOKEN_URI_SCHEME: tokenUri uses an unsupported scheme
 *
 * Other failure-like statuses (MISSING_TOKEN, INVALID_TOKEN_URI, THROTTLED_TOKEN_URI,
 * METADATA_CONTENT_TOO_LARGE, INVALID_METADATA, INVALID_METADATA_JSON) are NOT
 * included because they can be transient or re-indexable, and the rest of the
 * Avalabs ecosystem does not hide them.
 */
const UNREACHABLE_INDEX_STATUSES = new Set<NftTokenMetadataStatus>([
  NftTokenMetadataStatus.UNREACHABLE_TOKEN_URI,
  NftTokenMetadataStatus.INVALID_TOKEN_URI_SCHEME
])

export function isUnreachableNftIndexStatus(
  status: NftTokenMetadataStatus | undefined
): boolean {
  return status !== undefined && UNREACHABLE_INDEX_STATUSES.has(status)
}
