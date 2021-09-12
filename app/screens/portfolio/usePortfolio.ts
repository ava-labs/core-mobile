import {useEffect, useState} from 'react';
import {BN, Utils} from '@avalabs/avalanche-wallet-sdk';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

export function usePortfolio(): {
  addressX: string;
  addressP: string;
  addressC: string;
  balanceTotalInUSD: string;
} {
  const walletStateContext = useWalletStateContext();
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [addressX, setAddressX] = useState('');
  const [addressP, setAddressP] = useState('');
  const [addressC, setAddressC] = useState('');
  const [balanceAvaxTotal, setBalanceAvaxTotal] = useState<BN>(new BN(0));
  const [balanceTotalInUSD, setBalanceTotalInUSD] = useState('');

  useEffect(() => {
    if (walletStateContext) {
      setAvaxPrice(walletStateContext.avaxPrice);
      setAddressX(walletStateContext.addresses.addrX);
      setAddressP(walletStateContext.addresses.addrP);
      setAddressC(walletStateContext.addresses.addrC);
      setBalanceAvaxTotal(walletStateContext.balances.balanceAvaxTotal);
    }
  }, [walletStateContext]);

  useEffect(() => {
    const total =
      parseFloat(Utils.bnToLocaleString(balanceAvaxTotal, 9)) * avaxPrice;
    setBalanceTotalInUSD('$' + total.toFixed(2));
  }, [avaxPrice, balanceAvaxTotal]);

  return {addressX, addressP, addressC, balanceTotalInUSD};
}
