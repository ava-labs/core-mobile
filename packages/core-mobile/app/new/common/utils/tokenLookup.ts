import { BlockchainNamespace } from '@avalabs/core-chains-sdk'

const EVM_NAMESPACE_PREFIX = `${BlockchainNamespace.EIP155}:`

const isEvmCaip2Id = (caip2Id: string): boolean =>
  caip2Id.toLowerCase().startsWith(EVM_NAMESPACE_PREFIX)

/**
 * The token-aggregator's canonical casing: EVM (`eip155:`) ids and addresses
 * are lowercased, everything else is left verbatim. Solana caip2 ids and mint
 * addresses are case-sensitive base58 -- lowercasing them returns no results
 * (confirmed against the live endpoint).
 *
 * Use these for both request bodies and response-map keys so the two can never
 * disagree.
 */
export const normalizeLookupAddress = (
  caip2Id: string,
  address: string
): string => (isEvmCaip2Id(caip2Id) ? address.toLowerCase() : address)

/**
 * Builds the `/v1/token/lookup` response-map key -- `data.data` is keyed as
 * `{caip2Id}-{address}`, cased per `normalizeLookupAddress` above.
 */
export const tokenLookupKey = (caip2Id: string, address: string): string => {
  const key = `${caip2Id}-${address}`
  return isEvmCaip2Id(caip2Id) ? key.toLowerCase() : key
}
