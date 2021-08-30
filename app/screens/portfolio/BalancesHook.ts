import {BN, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {
  AssetBalanceP,
  WalletBalanceX,
} from '@avalabs/avalanche-wallet-sdk/dist/Wallet/types';
import {useEffect, useState} from 'react';
import {GetStakeResponse} from 'avalanche/dist/common';

enum WalletEvents {
  BalanceChangedX = 'balanceChangedX',
  BalanceChangedP = 'balanceChangedP',
  BalanceChangedC = 'balanceChangedC',
}

export function useBalances(w: MnemonicWallet) {
  const [wallet] = useState(w);
  const [newBalanceX, setNewBalanceX] = useState<WalletBalanceX>(
    wallet.getBalanceX(),
  );
  const [newBalanceP, setNewBalanceP] = useState(wallet.getAvaxBalanceP());
  const [newBalanceC, setNewBalanceC] = useState(wallet.getAvaxBalanceC());

  const [availableX, setAvailableX] = useState('-- AVAX');
  const [availableP, setAvailableP] = useState('-- AVAX');
  const [availableC, setAvailableC] = useState('-- AVAX');
  const [stakingAmount, setStakingAmount] = useState('-- AVAX');
  const [availableTotal, setAvailableTotal] = useState('-- AVAX');

  const [lockedX, setLockedX] = useState('-- AVAX');
  const [lockedP, setLockedP] = useState('-- AVAX');
  const [lockedStakeable, setLockedStakeable] = useState('-- AVAX');

  const balanceXtoBN = (newBalanceX?: WalletBalanceX): BN => {
    if (newBalanceX === undefined) {
      return new BN(0);
    }
    return newBalanceX.U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK
      .unlocked;
  };
  const balancePToBN = (newBalanceP?: AssetBalanceP): BN => {
    if (newBalanceP === undefined) {
      return new BN(0);
    }
    return newBalanceP.unlocked;
  };

  const balanceCToBN = async (newBalanceC?: BN): Promise<BN> => {
    await wallet.evmWallet.updateBalance();
    if (newBalanceC === undefined) {
      return new BN(0);
    }
    return newBalanceC;
  };

  const bnXToReadableString = (balanceX: BN): string => {
    const symbol = 'AVAX';
    return Utils.bnToAvaxX(balanceX) + ' ' + symbol;
  };

  const bnPToReadableString = (balanceP: BN): string => {
    const symbol = 'AVAX';
    return Utils.bnToAvaxP(balanceP) + ' ' + symbol;
  };

  const bnCToReadableString = (balanceC: BN): string => {
    const symbol = 'AVAX';
    return Utils.bnToAvaxC(balanceC) + ' ' + symbol;
  };

  const fetchStake = async (wallet: MnemonicWallet): Promise<BN> => {
    const stake: GetStakeResponse = await wallet.getStake();
    return stake === undefined ? new BN(0) : stake.staked;
  };

  const stakeToReadableString = async (
    wallet: MnemonicWallet,
  ): Promise<string> => {
    const stake: BN = await fetchStake(wallet);
    const symbol = 'AVAX';
    return Utils.bnToLocaleString(stake, 9) + ' ' + symbol;
  };

  const getTotalAmount = (
    balanceX: BN,
    balanceP: BN,
    balanceC: BN,
    stake: BN,
  ): string => {
    const bigx = Utils.bnToBigAvaxX(balanceX);
    const bigp = Utils.bnToBigAvaxP(balanceP);
    const bigc = Utils.bnToBigAvaxC(balanceC);
    const bigs = Utils.bnToBig(stake, 9);
    const total = bigx.add(bigp).add(bigc).add(bigs);
    const symbol = 'AVAX';
    return Utils.bigToLocaleString(total, 6) + ' ' + symbol;
  };

  // ---------------  EFFECTS ------------------

  useEffect(() => {
    const onBalanceChangedX = (balance: WalletBalanceX): void => {
      setNewBalanceX(balance);
    };

    const onBalanceChangedP = (balance: AssetBalanceP): void => {
      setNewBalanceP(balance);
    };

    const onBalanceChangedC = (balance: BN): void => {
      setNewBalanceC(balance);
    };

    wallet.on(WalletEvents.BalanceChangedX, onBalanceChangedX);
    wallet.on(WalletEvents.BalanceChangedP, onBalanceChangedP);
    wallet.on(WalletEvents.BalanceChangedC, onBalanceChangedC);

    return () => {
      wallet.off(WalletEvents.BalanceChangedX, onBalanceChangedX);
      wallet.off(WalletEvents.BalanceChangedP, onBalanceChangedP);
      wallet.off(WalletEvents.BalanceChangedC, onBalanceChangedC);
    };
  }, [wallet]);

  useEffect(() => {
    setAvailableX(bnXToReadableString(balanceXtoBN(newBalanceX)));
  }, [newBalanceX]);

  useEffect(() => {
    setAvailableP(bnPToReadableString(balancePToBN(newBalanceP)));
  }, [newBalanceP]);

  useEffect(() => {
    balanceCToBN(newBalanceC)
      .then(value => setAvailableC(bnCToReadableString(value)))
      .catch(reason => console.error(reason));
  }, [newBalanceC]);

  useEffect(() => {
    stakeToReadableString(wallet)
      .then(value => setStakingAmount(value))
      .catch(reason => console.error(reason));
  }, [wallet]);

  useEffect(() => {
    Promise.all([balanceCToBN(newBalanceC), fetchStake(wallet)])
      .then(([balC, stake]) => {
        setAvailableTotal(
          getTotalAmount(
            balanceXtoBN(newBalanceX),
            balancePToBN(newBalanceP),
            balC,
            stake,
          ),
        );
      })
      .catch(reason => console.error(reason));
  }, [newBalanceX, newBalanceP, newBalanceC, stakingAmount]);

  return {
    availableX,
    availableP,
    lockedX,
    lockedP,
    lockedStakeable,
    availableC,
    stakingAmount,
    availableTotal,
  };
}
