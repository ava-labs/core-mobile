/// <reference types="node" />
import { Transaction } from '@ethereumjs/tx';
import { KeyChain as EVMKeyChain, KeyPair as EVMKeyPair, UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import EvmWalletReadonly from "./EvmWalletReadonly";
export default class EvmWallet extends EvmWalletReadonly {
    private privateKey;
    constructor(key: Buffer);
    private getPrivateKeyBech;
    getKeyChain(): EVMKeyChain;
    getKeyPair(): EVMKeyPair;
    signEVM(tx: Transaction): Transaction;
    signC(tx: EVMUnsignedTx): EVMTx;
    getPrivateKeyHex(): string;
}
