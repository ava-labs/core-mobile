// Mirrors core-web's `getValidatorExplorerUrl` — links to a validator's page
// on the Avalanche subnets explorer.
const AVALANCHE_EXPLORER_URL = 'https://subnets.avax.network'
const AVALANCHE_EXPLORER_TESTNET_URL = 'https://subnets-test.avax.network'

export const getValidatorExplorerUrl = (
  isDeveloperMode: boolean,
  nodeId: string
): string => {
  const baseUrl = isDeveloperMode
    ? AVALANCHE_EXPLORER_TESTNET_URL
    : AVALANCHE_EXPLORER_URL
  return `${baseUrl}/validators/${nodeId}`
}
