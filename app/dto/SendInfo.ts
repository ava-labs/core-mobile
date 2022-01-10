import {Big, BN, Utils} from '@avalabs/avalanche-wallet-sdk';

// I know, I'm disgusted by it too, but it's a simple,
// quick, dirty hack that works. Will remove this when
// there's an opportunity to refactor.

export function stringAmountToBN(amount: string, denomination = 9): BN {
  if (!amount) {
    return new BN(0);
  }
  try {
    return Utils.numberToBN(amount, denomination);
  } catch (e) {
    return new BN(0);
  }
}

export function bnAmountToString(amount?: BN): string {
  return amount ? Utils.bnToAvaxC(amount) : '0.00';
}

export function bnToNumber(amount: BN) {
  const stringValue = bnAmountToString(amount);
  return Number.parseFloat(stringValue).toFixed(3);
}
