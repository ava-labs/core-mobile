import {useCallback, useEffect, useState} from 'react';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

export type UsePortfolioData = {
  addressC: string;
  balanceTotalInUSD: string;
  addressP: string;
  balanceAvaxTotal: string;
  addressX: string;
  isBalanceLoading: boolean;
  isWalletReady: boolean;
};

export function usePortfolio(): UsePortfolioData {
  const walletStateContext = useWalletStateContext();

  const [balanceAvaxTotal, setBalanceAvaxTotal] = useState<string>('- AVAX');
  const [balanceTotalInUSD, setBalanceTotalInUSD] = useState('');

  const calculateUsdBalance = useCallback(() => {
    const balanceAvaxString = Utils.bnToLocaleString(
      walletStateContext?.balances?.balanceAvaxTotal ?? new BN(0),
      9,
    );
    const total =
      parseFloat(balanceAvaxString) * (walletStateContext?.avaxPrice ?? 1);
    setBalanceTotalInUSD('$' + total.toFixed(2));
    setBalanceAvaxTotal(balanceAvaxString + ' AVAX');
  }, [
    walletStateContext?.avaxPrice,
    walletStateContext?.balances?.balanceAvaxTotal,
  ]);

  useEffect(() => {
    if (walletStateContext) {
      calculateUsdBalance();
    }
  }, [walletStateContext]);

  return {
    addressX: walletStateContext?.addresses?.addrX ?? '',
    addressP: walletStateContext?.addresses?.addrP ?? '',
    addressC: walletStateContext?.addresses?.addrC ?? '',
    balanceTotalInUSD,
    balanceAvaxTotal,
    isBalanceLoading: walletStateContext?.isBalanceLoading ?? true,
    isWalletReady: walletStateContext?.isWalletReady ?? false,
  };
}
