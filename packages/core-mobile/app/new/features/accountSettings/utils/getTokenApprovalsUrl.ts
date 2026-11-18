import { ChainId } from '@avalabs/core-chains-sdk'

/**
 * Third-party tool used to list and revoke token approvals (WSR-PERM-005).
 * Documented in docs/index.md and catalog-info.yaml.
 */
export const REVOKE_CASH_URL = 'https://revoke.cash'

/**
 * revoke.cash page listing the token approvals of `address`, opened on the
 * Avalanche C-Chain (Fuji in developer mode). Users can switch chains on the
 * site itself.
 */
export const getTokenApprovalsUrl = ({
  address,
  isDeveloperMode
}: {
  address: string
  isDeveloperMode: boolean
}): string => {
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  return `${REVOKE_CASH_URL}/address/${encodeURIComponent(
    address
  )}?chainId=${chainId}`
}
