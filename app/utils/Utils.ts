import Big from 'big.js';
import {BigNumber, BigNumberish} from 'ethers';
import {BNLike} from 'ethereumjs-util';

export const truncateAddress = (address: string, size = 6): string => {
  const firstChunk = address.substring(0, size);
  const lastChunk = address.substr(-(size / 2));

  return `${firstChunk}...${lastChunk}`;
};

export function formatTokenAmount(amount: Big, denomination = 2): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: denomination,
  });

  return formatter.format(amount.toNumber());
}

export function makeBNLike(n: BigNumberish | undefined): BNLike | undefined {
  if (n == null) {
    return undefined;
  }
  return BigNumber.from(n).toHexString();
}

export const displaySeconds = (timeInSeconds: number): string => {
  return timeInSeconds >= 3600
    ? new Date(timeInSeconds * 1000).toISOString().substr(11, 8) // HH:MM:SS
    : new Date(timeInSeconds * 1000).toISOString().substr(14, 5); // MM:SS
}
