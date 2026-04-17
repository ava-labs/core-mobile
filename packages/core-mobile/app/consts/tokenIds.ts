export const tokenIds = {
  ETH: 'NATIVE-eth',
  AVAX: 'NATIVE-avax',
  SOL: 'NATIVE-sol',
  BTC: 'NATIVE-btc',
  BTC_B: 'eip155:43114-0x152b9d0fdc40c096757f570a51e494bd4b943e50',
  BTC_B_FUJI: 'eip155:43113-0x71ba2b8dc58e7ca1b6d81a60729e31aefa37ae02',
  // Core Token Aggregator API uses this internalId for USDC across all chains; chain-specific address is in the platforms field
  USDC: 'eip155:1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
} as const

// Raw contract addresses for cases where we need to match against token.address
export const tokenAddresses = {
  USDC_SOLANA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
} as const
