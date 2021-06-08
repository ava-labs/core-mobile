/// <reference types="bn.js" />
/// <reference types="node" />
import { BN } from 'avalanche';
export default class EvmWalletReadonly {
    balance: BN;
    address: string;
    publicKey: Buffer;
    constructor(publicKey: Buffer);
    getBalance(): BN;
    getAddress(): string;
    updateBalance(): Promise<BN>;
}
