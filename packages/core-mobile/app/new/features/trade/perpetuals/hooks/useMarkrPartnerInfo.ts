import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Config from 'react-native-config'
import { z } from 'zod'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'

/** App-wide networking stack; matches how the perps REST client is built. */
const appFetch = nitroFetch as unknown as typeof fetch

/**
 * Shape returned by Markr's partner-info endpoint for a given product.
 *
 * - `name` — human-readable partner label (e.g. `"Core"`).
 * - `address` — recipient EOA that will collect the per-fill builder fee on
 *   Hyperliquid. Used as `builder.b` on every order action.
 * - `fee` — fee charged on each fill, in **tenths of basis points** (HL's
 *   native unit). E.g. `45` = `0.045%`, `100` = `0.10%` = HL perp max.
 *   No conversion needed; pass straight through as `builder.f` and as the
 *   `maxFeeRateTenthsBps` parameter of `approveBuilderFee`.
 */
export type MarkrPartnerInfo = {
  readonly name: string
  readonly address: `0x${string}`
  readonly fee: number
}

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/

const markrPartnerInfoSchema = z.object({
  name: z.string().min(1),
  address: z.string().regex(HEX_ADDRESS, 'Invalid EVM address'),
  fee: z.number().nonnegative()
}) as z.ZodType<MarkrPartnerInfo>

/** 1h — partner address/fee changes are rare and a stale read is harmless (HL just rejects orders if the fee is above the approved cap). */
const STALE_TIME_MS = 60 * 60 * 1000

/**
 * Fetches the Markr partner info (builder address + per-fill fee) for the
 * given product. The returned `fee` is already in Hyperliquid's tenths of
 * basis points, so it can be passed straight through to `builder.f`.
 *
 * The endpoint lives behind the Markr proxy so no API key is needed on the
 * client.
 */
export function useMarkrPartnerInfo(
  product: 'perps' | 'spot' | 'swap'
): UseQueryResult<MarkrPartnerInfo> {
  return useQuery({
    queryKey: [ReactQueryKeys.PERPS_MARKR_PARTNER_INFO, product],
    staleTime: STALE_TIME_MS,
    queryFn: async ({ signal }): Promise<MarkrPartnerInfo> => {
      if (!Config.PROXY_URL) {
        throw new Error('PROXY_URL is missing')
      }
      const res = await appFetch(
        `${
          Config.PROXY_URL
        }/proxy/markr-helium/info/partner?product=${encodeURIComponent(
          product
        )}`,
        { signal }
      )
      if (!res.ok) {
        throw new Error(`Markr partner info: HTTP ${res.status}`)
      }
      const data = (await res.json()) as unknown
      return markrPartnerInfoSchema.parse(data)
    }
  })
}

/**
 * Markr's `fee` is already in Hyperliquid's `builder.f` unit (tenths of
 * basis points), so this is an identity round/clamp — provided to keep call
 * sites explicit about the unit they expect and to guard against NaN /
 * negative payloads.
 */
export function markrFeeToHyperliquidTenthsBps(fee: number): number {
  if (!Number.isFinite(fee) || fee < 0) {
    return 0
  }
  return Math.round(fee)
}
