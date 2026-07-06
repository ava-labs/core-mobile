import { TokenType } from '@avalabs/vm-module-types'
import { TokenInfo } from 'common/hooks/useTokenLookup'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { xpChainToken } from 'utils/units/knownTokens'
import { DEFAULT_TOKEN_DECIMALS, NATIVE_DECIMALS } from '../consts'
import { mapApiTokenToLocal } from './mapApiTokenToLocal'

const resolveDecimals = (
  isNative: boolean,
  nativeDecimals: number | undefined,
  {
    metaDecimals,
    balanceData
  }: {
    metaDecimals: number | null | undefined
    balanceData: LocalTokenWithBalance | undefined
  }
): number => {
  if (isNative && nativeDecimals !== undefined) return nativeDecimals
  if (typeof metaDecimals === 'number') return metaDecimals
  if (balanceData && 'decimals' in balanceData) return balanceData.decimals
  return DEFAULT_TOKEN_DECIMALS
}

export const buildLocalToken = ({
  accountTokens,
  tokenInfo,
  caip2Id,
  chainId
}: {
  accountTokens: LocalTokenWithBalance[]
  tokenInfo: TokenInfo
  caip2Id: string
  chainId: number
}): LocalTokenWithBalance => {
  // Match by internalId first; fall back to type+address matching
  // since internalId formatting can differ between API and accountTokens.
  const balanceData =
    accountTokens.find(
      t => t.internalId === tokenInfo.internalId && t.networkChainId === chainId
    ) ??
    (tokenInfo.isNative
      ? accountTokens.find(
          t => t.type === TokenType.NATIVE && t.networkChainId === chainId
        )
      : accountTokens.find(t => {
          const address = tokenInfo.platforms?.[caip2Id]
          return (
            address !== undefined &&
            'address' in t &&
            t.address.toLowerCase() === address.toLowerCase() &&
            t.networkChainId === chainId
          )
        }))
  const isNative = balanceData?.type === TokenType.NATIVE || tokenInfo.isNative

  const nativeDecimals =
    NATIVE_DECIMALS[tokenInfo.internalId as keyof typeof NATIVE_DECIMALS]

  const address = isNative
    ? ''
    : balanceData?.address ?? tokenInfo.platforms?.[caip2Id] ?? ''

  // NATIVE_DECIMALS keys AVAX at 18 (C-Chain), but native AVAX on P/X-Chain is
  // 9-decimal nAVAX. Override so balances/amounts render at the chain's actual
  // precision — otherwise a 9-decimal balance shown at 18 decimals reads as 0.
  // Mirrors mapSdkAssetToLocal's handling of the swap "to" side (CP-14511).
  const decimals =
    isNative && (isPChain(chainId) || isXChain(chainId))
      ? xpChainToken.maxDecimals
      : resolveDecimals(isNative, nativeDecimals, {
          metaDecimals: tokenInfo.meta?.decimals?.[caip2Id],
          balanceData
        })

  return mapApiTokenToLocal(
    {
      symbol: balanceData?.symbol ?? tokenInfo.symbol,
      name: balanceData?.name ?? tokenInfo.name,
      address,
      decimals,
      isNative,
      internalId: balanceData?.internalId ?? tokenInfo.internalId,
      logoUri: balanceData?.logoUri ?? tokenInfo.meta?.logoUri ?? null,
      networkCaip2Id: caip2Id,
      top250Rank: null,
      contractType: null
    },
    chainId,
    balanceData
  )
}
