import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import Big from 'big.js'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { isNetworkContractToken } from 'utils/isNetworkContractToken'
import { USDC_CCHAIN_ADDRESS, USDC_DECIMALS } from '../consts'

export type CChainUsdc = {
  /** Raw on-chain balance in the token's smallest unit. */
  readonly balance: bigint
  /** Human-readable balance (balance / 10^decimals). */
  readonly formattedBalance: Big
  /** Token decimals (6 for USDC). */
  readonly decimals: number
  /** USDC contract address on C-Chain, when resolved from the balance list. */
  readonly address: string | undefined
  readonly isLoading: boolean
}

/**
 * The connected account's native USDC balance on Avalanche C-Chain — the
 * source asset for a Hyperliquid perps deposit. Perps are mainnet-only, so we
 * always read from C-Chain mainnet and never a testnet C-Chain.
 */
export const useCChainUsdc = (): CChainUsdc => {
  const activeAccount = useSelector(selectActiveAccount)
  const { data: balances, isLoading } = useAccountBalances(activeAccount)

  return useMemo(() => {
    const cChain = balances.find(
      b => b.chainId === ChainId.AVALANCHE_MAINNET_ID
    )
    const token = cChain?.tokens.find(
      t =>
        isNetworkContractToken(t) &&
        t.type === TokenType.ERC20 &&
        t.address.toLowerCase() === USDC_CCHAIN_ADDRESS.toLowerCase()
    )

    if (
      token === undefined ||
      !isNetworkContractToken(token) ||
      token.type !== TokenType.ERC20
    ) {
      return {
        balance: 0n,
        formattedBalance: new Big(0),
        decimals: USDC_DECIMALS,
        address: undefined,
        isLoading
      }
    }

    const decimals = token.decimals
    const formattedBalance = new Big(token.balance.toString()).div(
      new Big(10).pow(decimals)
    )

    return {
      balance: token.balance,
      formattedBalance,
      decimals,
      address: token.address,
      isLoading
    }
  }, [balances, isLoading])
}
