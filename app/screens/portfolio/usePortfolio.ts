import {useCallback, useEffect, useState} from 'react';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

export type UsePortfolioData = {
  addressC: string;
  balanceTotalInUSD: string;
  addressP: string;
  balanceAvaxTotal: string;
  addressX: string;
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
  }, []);

  return {
    addressX: walletStateContext?.addresses?.addrX ?? '',
    addressP: walletStateContext?.addresses?.addrP ?? '',
    addressC: walletStateContext?.addresses?.addrC ?? '',
    balanceTotalInUSD,
    balanceAvaxTotal,
  };
}
