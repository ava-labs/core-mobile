import {useEffect, useState} from 'react';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

export function usePortfolio(): {
  addressC: string;
  balanceTotalInUSD: string;
  addressP: string;
  balanceAvaxTotal: string;
  addressX: string;
} {
  const walletStateContext = useWalletStateContext();
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [addressX, setAddressX] = useState('');
  const [addressP, setAddressP] = useState('');
  const [addressC, setAddressC] = useState('');
  const [balanceAvaxTotalBN, setBalanceAvaxTotalBN] = useState<BN>(new BN(0));
  const [balanceAvaxTotal, setBalanceAvaxTotal] = useState<string>('- AVAX');
  const [balanceTotalInUSD, setBalanceTotalInUSD] = useState('');

  useEffect(() => {
    if (walletStateContext) {
      setAvaxPrice(walletStateContext.avaxPrice);
      setAddressX(walletStateContext.addresses.addrX);
      setAddressP(walletStateContext.addresses.addrP);
      setAddressC(walletStateContext.addresses.addrC);
      setBalanceAvaxTotalBN(walletStateContext.balances.balanceAvaxTotal);
    }
  }, [walletStateContext]);

  useEffect(() => {
    const balanceAvaxString = Utils.bnToLocaleString(balanceAvaxTotalBN, 9);
    const total = parseFloat(balanceAvaxString) * avaxPrice;
    setBalanceTotalInUSD('$' + total.toFixed(2));
    setBalanceAvaxTotal(balanceAvaxString + ' AVAX');
  }, [avaxPrice, balanceAvaxTotalBN]);

  return {addressX, addressP, addressC, balanceTotalInUSD, balanceAvaxTotal};
}
