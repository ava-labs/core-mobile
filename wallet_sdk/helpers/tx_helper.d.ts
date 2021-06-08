/// <reference types="bn.js" />
import { BN } from 'avalanche';
import { UnsignedTx as AVMUnsignedTx, UTXO as AVMUTXO, UTXOSet, UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm';
import { PayloadBase } from 'avalanche/dist/utils';
import { UTXOSet as PlatformUTXOSet, UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx } from 'avalanche/dist/apis/evm';
import { AvmExportChainType } from '../Wallet/types';
import { Transaction } from '@ethereumjs/tx';
export declare function buildCreateNftFamilyTx(name: string, symbol: string, groupNum: number, fromAddrs: string[], minterAddr: string, changeAddr: string, utxoSet: UTXOSet): Promise<AVMUnsignedTx>;
export declare function buildMintNftTx(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number, ownerAddress: string, changeAddress: string, fromAddresses: string[], utxoSet: UTXOSet): Promise<AVMUnsignedTx>;
export declare function buildAvmExportTransaction(destinationChain: AvmExportChainType, utxoSet: AVMUTXOSet, fromAddresses: string[], toAddress: string, amount: BN, // export amount + fee
sourceChangeAddress: string): Promise<AVMUnsignedTx>;
export declare function buildPlatformExportTransaction(utxoSet: PlatformUTXOSet, fromAddresses: string[], toAddress: string, amount: BN, // export amount + fee
sourceChangeAddress: string): Promise<PlatformUnsignedTx>;
export declare function buildEvmExportTransaction(fromAddresses: string[], toAddress: string, amount: BN, // export amount + fee
fromAddressBech: string): Promise<EVMUnsignedTx>;
export declare function buildEvmTransferNativeTx(from: string, to: string, amount: BN, // in wei
gasPrice: BN, gasLimit: number): Promise<Transaction>;
export declare function buildEvmTransferErc20Tx(from: string, to: string, amount: BN, // in wei
gasPrice: BN, gasLimit: number, contractAddress: string): Promise<Transaction>;
export declare function buildEvmTransferErc721Tx(from: string, to: string, gasPrice: BN, gasLimit: number, tokenContract: string, tokenId: string): Promise<Transaction>;
export declare enum AvmTxNameEnum {
    'Transaction',
    'Mint',
    'Operation',
    'Import',
    'Export'
}
export declare enum PlatfromTxNameEnum {
    'Transaction',
    'Add Validator',
    'Add Delegator',
    'Import',
    'Export',
    'Add Subnet Validator',
    'Create Chain',
    'Create Subnet',
    'Advance Time',
    'Reward Validator'
}
export declare enum ParseableAvmTxEnum {
    'Transaction',
    'Import',
    'Export'
}
export declare enum ParseablePlatformEnum {
    'Transaction',
    'Add Validator',
    'Add Delegator',
    'Import',
    'Export'
}
export declare enum ParseableEvmTxEnum {
    'Import',
    'Export'
}
