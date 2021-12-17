import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useState,
} from 'react';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {getSwapRate} from 'swap/getSwapRate';
import BN from 'bn.js';
import {getDecimalsForEVM} from 'utils/TokenTools';
import {Utils} from '@avalabs/avalanche-wallet-sdk';
import {SwapSide} from 'paraswap';

export interface SwapEntry {
  token: TokenWithBalance | undefined;
  setToken: Dispatch<TokenWithBalance>;
  amount: number;
  setAmount: Dispatch<number>;
  usdValue: string;
}

export interface TrxDetails {
  rate: string;
  slippageTol: string;
  networkFee: string;
  networkFeeUsd: string;
  avaxWalletFee: string;
}

export interface SwapContextState {
  swapFrom: SwapEntry;
  swapTo: SwapEntry;
  swapFromTo: () => void;
  trxDetails: TrxDetails;
}

export const SwapContext = createContext<SwapContextState>({} as any);

export const SwapContextProvider = ({children}: {children: any}) => {
  const [fromToken, setFromToken] = useState<TokenWithBalance>();
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [fromUsdAmount, setFromUsdAmount] = useState<string>('');
  const [toToken, setToToken] = useState<TokenWithBalance>();
  const [toAmount, setToAmount] = useState<number>(0);
  const [toUsdAmount, setToUsdAmount] = useState<string>('');
  const [trxRate, setTrxRate] = useState<string>('');
  const [slipTol, setSlipTol] = useState<string>('.12%');
  const [networkFee, setNetworkFee] = useState<string>('- AVAX');
  const [networkFeeUsd, setNetworkFeeUsd] = useState<string>('$- USD');
  const [avaxWalletFee, setAvaxWalletFee] = useState<string>('0 AVAX');
  const [swapSide, setSwapSide] = useState<SwapSide>(SwapSide.SELL);

  useEffect(() => {
    if (swapSide === SwapSide.SELL ? isNaN(fromAmount) : isNaN(toAmount)) {
      return;
    }
    const amount = Utils.numberToBN(
      swapSide === SwapSide.SELL ? fromAmount : toAmount,
      getDecimalsForEVM(swapSide === SwapSide.SELL ? fromToken : toToken) ?? 0,
    ).toString();
    getSwapRate({
      srcToken: fromToken,
      destToken: toToken,
      amount: amount,
      swapSide,
    }).then(val => {
      const result = val.result;
      const destAmount = Utils.bnToBig(
        new BN(result.destAmount),
        result.destDecimals,
      );
      const srcAmount = Utils.bnToBig(
        new BN(result.srcAmount),
        result.srcDecimals,
      );
      const destAmountBySrcAmount = destAmount.div(srcAmount).toString();

      setFromAmount(srcAmount.toNumber());
      setToAmount(destAmount.toNumber());
      setFromUsdAmount(result.srcUSD);
      setToUsdAmount(result.destUSD);
      setAvaxWalletFee(`${result.partnerFee} AVAX`);
      setTrxRate(
        `1 ${fromToken?.symbol} ≈ ${destAmountBySrcAmount} ${toToken?.symbol}`,
      );
    });
  }, [fromToken, toToken, fromAmount, toAmount, swapSide]);

  const setSrcAmount = (amount: number) => {
    setSwapSide(SwapSide.SELL);
    setFromAmount(amount);
  };
  const setDestAmount = (amount: number) => {
    setSwapSide(SwapSide.BUY);
    setToAmount(amount);
  };

  const swapFromTo = () => {
    const tempToken = toToken;
    setToToken(fromToken);
    setFromToken(tempToken);
    const tempAmount = toAmount;
    setToAmount(fromAmount);
    setFromAmount(tempAmount);
  };

  const state: SwapContextState = {
    swapFrom: {
      token: fromToken,
      setToken: setFromToken,
      amount: fromAmount,
      setAmount: setSrcAmount,
      usdValue: fromUsdAmount,
    },
    swapTo: {
      token: toToken,
      setToken: setToToken,
      amount: toAmount,
      setAmount: setDestAmount,
      usdValue: toUsdAmount,
    },
    swapFromTo,
    trxDetails: {
      rate: trxRate,
      slippageTol: slipTol,
      networkFee,
      networkFeeUsd,
      avaxWalletFee,
    },
  };
  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>;
};

export function useSwapContext() {
  return useContext(SwapContext);
}
