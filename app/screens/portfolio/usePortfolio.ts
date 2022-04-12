import {useMemo} from 'react'
import {useWalletStateContext} from '@avalabs/wallet-react-components'
import {mustNumber} from 'utils/JsTools'

export type UsePortfolioData = {
  addressC: string
  balanceTotalInUSD: string
  // addressP: string;
  // addressX: string;
  isBalanceLoading: boolean
  isWalletReady: boolean
  isErc20Loading: boolean
}

export function usePortfolio(): UsePortfolioData {
  const walletStateContext = useWalletStateContext()

  const balanceTotalInUSD = useMemo(() => {
    const erc20TokensTotalUsd =
      walletStateContext?.erc20Tokens
        .map(token => token.balanceUSD ?? 0)
        .reduce((acc, current) => {
          return acc + current
        }, 0) ?? 0
    return (
      mustNumber(
        () =>
          Number.parseFloat(
            walletStateContext!.avaxToken.balanceUsdDisplayValue ?? '0'
          ),
        0
      ) + erc20TokensTotalUsd
    ).toFixed(2)
  }, [
    walletStateContext?.avaxToken.balanceUSD,
    walletStateContext?.erc20Tokens
  ])

  return {
    // addressX: walletStateContext?.addresses?.addrX ?? '',
    // addressP: walletStateContext?.addresses?.addrP ?? '',
    addressC: walletStateContext?.addresses?.addrC ?? '',
    balanceTotalInUSD,
    isBalanceLoading: walletStateContext?.isBalanceLoading ?? true,
    isWalletReady: walletStateContext?.isWalletReady ?? false,
    isErc20Loading: walletStateContext?.isErc20TokenListLoading ?? true
  }
}
