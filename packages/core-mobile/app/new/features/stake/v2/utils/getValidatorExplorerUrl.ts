// Mirrors core-web's `getValidatorExplorerUrl` — links to a validator's page
// on the Builders Hub explorer.
const AVALANCHE_EXPLORER_URL = 'https://build.avax.network/explorer/mainnet'
const AVALANCHE_EXPLORER_TESTNET_URL =
  'https://build.avax.network/explorer/fuji'

export const getValidatorExplorerUrl = (
  isDeveloperMode: boolean,
  nodeId: string
): string => {
  const baseUrl = isDeveloperMode
    ? AVALANCHE_EXPLORER_TESTNET_URL
    : AVALANCHE_EXPLORER_URL
  return `${baseUrl}/p-chain/node/${nodeId}`
}
