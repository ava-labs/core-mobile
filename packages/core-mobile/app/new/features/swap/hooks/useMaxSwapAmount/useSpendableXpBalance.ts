import { skipToken, useQuery } from '@tanstack/react-query'
import { TokenType } from '@avalabs/vm-module-types'
import { Network } from '@avalabs/core-chains-sdk'
import { useSelector } from 'react-redux'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useGetFeeState } from 'hooks/earn/useGetFeeState'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { selectActiveAccount } from 'store/account'
import { selectIsFilterSmallUtxosActive } from 'store/settings/advanced/filterSmallUtxosActive'
import type { LocalTokenWithBalance } from 'store/balance'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'

/**
 * CP-13903: spendable balance for a native X-/P-Chain swap source, derived
 * from the dust-filtered UTXO set. Needed because the displayed balance can
 * stay dust-inclusive (the Balance API only honors `filterOutDustUtxos` on
 * P-Chain, and the VM-module fallback never filters), so a Max derived from
 * it would exceed what the CCT `getUtxos` callback offers the SDK.
 *
 * On P this is a conservative subset of the CCT spend set: the service
 * helper also applies the BaseP tx-size cap, which CCT `getUtxos` doesn't.
 * Max can only ever be lower than truly spendable, never higher.
 *
 * Returns:
 * - `spendableBalance` — filtered available balance in nAVAX, or undefined
 *   while loading / on error (callers must NOT fall back to the displayed
 *   balance in that case, or Max can exceed the spendable set)
 * - `isSpendableBalanceRequired` — true when the source token is native X/P
 *   AVAX and the small-UTXO filter is active
 */
export const useSpendableXpBalance = ({
  fromToken,
  fromNetwork
}: {
  fromToken: LocalTokenWithBalance | undefined
  fromNetwork: Network | undefined
}): {
  spendableBalance: bigint | undefined
  isSpendableBalanceRequired: boolean
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const filterSmallUtxos = useSelector(selectIsFilterSmallUtxosActive)
  const { xpAddresses } = useXPAddresses(activeAccount)
  const { getFeeState } = useGetFeeState()

  const chain = fromNetwork
    ? isPChain(fromNetwork.chainId)
      ? ('P' as const)
      : isXChain(fromNetwork.chainId)
      ? ('X' as const)
      : undefined
    : undefined

  const isSpendableBalanceRequired =
    filterSmallUtxos &&
    fromToken?.type === TokenType.NATIVE &&
    chain !== undefined

  // P needs a loaded feeState: getMaximumUtxoSet builds txs to measure
  // size, and an undefined feeState makes every build fail — the "capped"
  // set comes back empty and a bogus 0 balance would be cached.
  const feeState = chain === 'P' ? getFeeState() : undefined

  const enabled =
    isSpendableBalanceRequired &&
    activeAccount !== undefined &&
    fromNetwork !== undefined &&
    chain !== undefined &&
    xpAddresses.length > 0 &&
    (chain !== 'P' || feeState !== undefined)

  const { data, isFetching } = useQuery({
    // chain and isTestnet are derived from chainId, and account identity is
    // its id — the key below fully determines the fetch inputs.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.SPENDABLE_XP_BALANCE,
      activeAccount?.id,
      fromNetwork?.chainId,
      xpAddresses
    ],
    queryFn: enabled
      ? () =>
          AvalancheWalletService.getSpendableAvaxBalance({
            chain,
            account: activeAccount,
            isTestnet: Boolean(fromNetwork.isTestnet),
            xpAddresses,
            feeState,
            filterSmallUtxos: true
          })
      : skipToken,
    // Spendable UTXOs move with every send/swap and the key fields don't
    // (same account/network), so a cached value can describe a pre-spend
    // set. Always refetch on mount; react-query still dedupes concurrent
    // consumers within a render pass.
    staleTime: 0
  })

  return {
    // Hide cached data while a refetch is in flight: react-query serves the
    // previous value during background refetches, and a pre-spend balance
    // must never re-enable Max after UTXOs moved. Max stays disabled until
    // the current fetch lands.
    spendableBalance: isFetching ? undefined : data,
    isSpendableBalanceRequired
  }
}
