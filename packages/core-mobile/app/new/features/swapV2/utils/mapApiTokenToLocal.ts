import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ApiToken } from '../types'
import { getLocalTokenIdFromApi } from './getLocalTokenIdFromApi'

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
    // EVM chains use ERC20, Solana uses SPL
    return networkChainId === ChainId.SOLANA_MAINNET_ID
      ? TokenType.SPL
      : TokenType.ERC20
  }

  // Create localId for matching with balance data
  const localId = getLocalTokenIdFromApi(apiToken)

  // Format balance using TokenUnit
  const decimals = apiToken.decimals ?? 18
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

    // Required fields for different token types
    reputation: null
  } as LocalTokenWithBalance
}
