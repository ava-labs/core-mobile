import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';

export function useAccount(): {
  setSelectedAccount: (account: Account) => void;
  accounts: Account[];
} {
  const [accounts, setAccounts] = useState([] as Account[]);

  useEffect(() => {
    setAccounts([
      {
        title: 'Account 1',
        xAddress: 'X-fu...7yu2',
        cAddress: '0xfu...zk2e',
      } as Account,
      {
        title: 'Account 2',
        xAddress: 'neven',
        cAddress: 'skend',
      } as Account,
    ]);
  }, []);

  const setSelectedAccount = (account: Account) => {
    //todo store somewhere and navigate to
  };

  return {accounts, setSelectedAccount};
}
