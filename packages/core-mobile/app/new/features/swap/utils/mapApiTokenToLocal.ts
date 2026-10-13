import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { DEFAULT_TOKEN_DECIMALS } from '../consts'
import { ApiToken } from '../types'
import { getLocalTokenIdFromApi } from './getLocalTokenIdFromApi'
import { buildAvailableFields } from './buildAvailableFields'

export const mapApiTokenToLocal = (
  apiToken: ApiToken,
  networkChainId: number,
  balanceData?: LocalTokenWithBalance
): LocalTokenWithBalance => {
  const getTokenType = ():
    | TokenType.NATIVE
    | TokenType.ERC20
    | TokenType.SPL => {
    if (apiToken.isNative) {
      return TokenType.NATIVE
    }

    if (apiToken.contractType === 'ERC-20') {
      return TokenType.ERC20
    }

    if (apiToken.contractType === 'SPL') {
      return TokenType.SPL
    }

    // contractType can be null on the wire; fall back to the caip2Id namespace.
    return apiToken.networkCaip2Id.startsWith('solana:')
      ? TokenType.SPL
      : TokenType.ERC20
  }

  // Create localId for matching with balance data
  const localId = getLocalTokenIdFromApi(apiToken)

  // Format balance using TokenUnit
  const decimals = apiToken.decimals ?? DEFAULT_TOKEN_DECIMALS
  const balance = balanceData?.balance ?? 0n
  const balanceDisplayValue = new TokenUnit(
    balance,
    decimals,
    apiToken.symbol
  ).toDisplay()

  return {
    // Core token info from API
    type: getTokenType(),
    symbol: apiToken.symbol,
    name: apiToken.name,
    description: apiToken.name,
    decimals,
    logoUri: apiToken.logoUri ?? undefined,
    address: apiToken.address,

    // Required LocalTokenWithBalance fields
    localId,
    internalId: apiToken.internalId,
    networkChainId,
    isDataAccurate: true,

    // Balance info (from balanceData or defaults)
    balance,
    balanceDisplayValue,
    balanceInCurrency: balanceData?.balanceInCurrency ?? 0,
    priceInCurrency: balanceData?.priceInCurrency ?? 0,

    // Carry P/X-chain swappable-balance fields (available*, balancePerType) so a
    // preselected P/X source keeps them through the rebuild (CP-14788). No-op for
    // other token types.
    ...buildAvailableFields(balanceData, decimals, apiToken.symbol),

    // Required fields for different token types
    reputation: null,

    // Verification flag from the token aggregator (null/undefined => treat as verified)
    isVerified: apiToken.isVerified
  } as LocalTokenWithBalance
}
