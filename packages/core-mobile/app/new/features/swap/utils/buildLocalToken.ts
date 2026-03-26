import { TokenType } from '@avalabs/vm-module-types'
import { TokenInfo } from 'common/hooks/useTokenLookup'
import { LocalTokenWithBalance } from 'store/balance/types'
import { NATIVE_DECIMALS } from '../consts'
import { mapApiTokenToLocal } from './mapApiTokenToLocal'

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

  return mapApiTokenToLocal(
    {
      symbol: balanceData?.symbol ?? tokenInfo.symbol,
      name: balanceData?.name ?? tokenInfo.name,
      address,
      decimals:
        isNative && nativeDecimals !== undefined
          ? nativeDecimals
          : tokenInfo.meta?.decimals?.[caip2Id] ?? null,
      isNative,
      internalId: balanceData?.internalId ?? tokenInfo.internalId,
      logoUri: balanceData?.logoUri ?? tokenInfo.meta?.logoUri ?? null
    },
    chainId,
    balanceData
  )
}
