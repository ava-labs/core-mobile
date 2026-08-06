import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
// CP-14918 TEMP PROBE
import { perfWhy } from 'utils/performance/perfProbe'
import { NonXpTokenDetailScreen } from './NonXpTokenDetailScreen'
import { XpTokenDetailScreen } from './XpTokenDetailScreen'

export const TokenDetailScreen = (): React.JSX.Element => {
  const { localId, chainId } = useLocalSearchParams<{
    localId: string
    chainId: string
  }>()
  const activeAccount = useSelector(selectActiveAccount)

  // Resolve the token straight from this network's balance data.
  //
  // This used to go through `useSearchableTokenList`, which merges every
  // C-Chain and Ethereum contract token (~56k on mainnet) with the account's
  // balances and then filters and sorts the whole set — all to find one token
  // whose localId and chainId we already have from the route params. On a
  // Pixel 8 Pro that cost ~700ms of synchronous JS inside the push-to-paint
  // window, which is the stall reported in CP-14918.
  //
  // Zero-balance tokens still resolve here: the balance response keeps a token
  // entry (with a 0 balance) after its balance is spent, so the screen does not
  // break after sending a max balance.
  //
  // CP-14918: this screen can mount with no route params — PortfolioScreen's
  // router.prefetch('/tokenDetail') call warms this route before any token is
  // chosen. `chainId` is then `NaN`, which is falsy, so
  // useTokensWithBalanceForAccount's `if (chainId)` branch is skipped and it
  // falls through to the *other* branch: flatMap every token across every
  // enabled network for `activeAccount` — real synchronous work during
  // Portfolio's idle window, not the empty array a first read suggests.
  // Passing `activeAccount` also makes the hook's internal useAccountBalances
  // call mount a live QueryObserver on the same balanceKey every other
  // Portfolio consumer subscribes to (the observer-fan-out class Task O
  // fixed). Gate `account` on both params being present so the hook's
  // `!account` guard returns `[]` immediately instead — the query key it
  // builds from `account?.id` (undefined) is also disjoint from every real
  // consumer's key, so no observer joins the shared fan-out either.
  const hasRouteParams = Boolean(localId) && Boolean(chainId)

  const tokensForChain = useTokensWithBalanceForAccount({
    account: hasRouteParams ? activeAccount : undefined,
    chainId: Number(chainId)
  })

  const token = useMemo(
    () => tokensForChain.find(tk => tk.localId === localId),
    [tokensForChain, localId]
  )

  // CP-14918 TEMP PROBE: does the child re-render because this parent did?
  perfWhy('route', {
    localId,
    chainId,
    activeAccount,
    tokensForChain,
    tokensLen: tokensForChain.length,
    token
  })

  // CP-14918 C1/C2 fix: keep the preloaded, param-less instance a fully
  // inert render. Before this gate, that instance still mounted
  // `NonXpTokenDetailScreen` with `token=undefined`, which builds a REAL
  // child hook tree: `useTokenDetailData(undefined)` (3 background balance
  // observers), the RTK-Query 15s transaction poll, the unconditional
  // `isChartReady` mount effect (which defeats the chart-mount deferral —
  // see "Fix 3" — on nav #1 specifically, since by the time the real push
  // reuses this instance `isChartReady` is often already true), and the
  // one-shot `perfDumpQueryCache` timer. None of that is "frozen off" —
  // see the corrected comment in PortfolioScreen.tsx; a preloaded route is
  // never frozen. Rendering an empty fragment here means the preload only
  // warms this route's module graph and this component's own render, which
  // is all `router.prefetch` is for. When the real push reuses this SAME
  // instance (see the comment on `hasRouteParams` above), `hasRouteParams`
  // flips to `true` in that render pass and the child tree below mounts
  // fresh, on the tap-to-paint path — where the chart-defer/placeholder
  // logic is actually exercised, on nav #1 as intended. (An empty fragment,
  // not `null`, keeps this function's `React.JSX.Element` return type
  // intact rather than widening it to `| null` for every caller.)
  if (!hasRouteParams) {
    return <></>
  }

  if (token && (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))) {
    return <XpTokenDetailScreen token={token} />
  }
  return <NonXpTokenDetailScreen token={token} />
}
