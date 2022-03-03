import Big from 'big.js';
import {Asset} from '@avalabs/bridge-sdk';

export interface AssetBalance {
  symbol: string;
  asset: Asset;
  balance: Big | undefined;
}
