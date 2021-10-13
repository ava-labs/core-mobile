import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

export function useAccount(): {
  setSelectedAccount: (account: Account) => void;
  accounts: Account[];
} {
  const [accounts, setAccounts] = useState([] as Account[]);
  const walletState = useWalletStateContext();

  useEffect(() => {
    setAccounts([
      {
        title: 'Account1',
        xAddress: walletState?.addresses?.addrX,
        cAddress: walletState?.addresses?.addrC,
      } as Account,
    ]);
  }, []);

  const setSelectedAccount = (account: Account) => {
    //todo store somewhere and navigate to
  };

  return {accounts, setSelectedAccount};
}
