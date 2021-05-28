/// <reference types="bn.js" />
/// <reference types="node" />
import { BN } from 'avalanche';
export default class EvmWalletReadonly {
    balance: BN;
    address: string;
    publicKey: Buffer;
    constructor(publicKey: Buffer);
    getAddress(): string;
    updateBalance(): Promise<BN>;
}
