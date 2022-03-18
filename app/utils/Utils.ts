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
};

/**
 * Used to display large USD sums like market cap, volue as such:
 * $32.2M, $1.6B
 * @param num
 * @param digits
 */
// source: https://stackoverflow.com/a/9462382
export function largeCurrencyFormatter(num: number | string, digits: number) {
  const number = typeof num === 'number' ? num : Number(num);
  const lookup = [
    {value: 1, symbol: ''},
    {value: 1e3, symbol: 'k'},
    {value: 1e6, symbol: 'M'},
    {value: 1e9, symbol: 'B'},
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return number >= item.value;
    });
  return (
    '$' +
    (item
      ? (number / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
      : '0')
  );
}
