/// <reference types="bn.js" />
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm';
import { BN } from 'avalanche';
import MnemonicWallet from './MnemonicWallet';
import SingletonWallet from "./SingletonWallet";
import { iAssetDescriptionClean } from "../Asset/types";
import LedgerWallet from "./LedgerWallet";
export interface IIndexKeyCache {
    [index: number]: AVMKeyPair;
}
export declare type ChainAlias = 'X' | 'P';
export declare type AvmImportChainType = 'P' | 'C';
export declare type AvmExportChainType = 'P' | 'C';
export declare type HdChainType = 'X' | 'P';
export declare type WalletNameType = 'mnemonic' | 'ledger' | 'singleton';
export declare type WalletType = MnemonicWallet | SingletonWallet | LedgerWallet;
export interface WalletBalanceX {
    [assetId: string]: AssetBalanceX;
}
export interface AssetBalanceX {
    locked: BN;
    unlocked: BN;
    meta: iAssetDescriptionClean;
}
export interface AssetBalanceRawX {
    locked: BN;
    unlocked: BN;
}
export interface AssetBalanceP {
    locked: BN;
    unlocked: BN;
    lockedStakeable: BN;
}
export interface WalletBalanceERC20 {
    [address: string]: ERC20Balance;
}
export interface ERC20Balance {
    balance: BN;
    balanceParsed: string;
    name: string;
    symbol: string;
    denomination: number;
    address: string;
}
export interface ILedgerAppConfig {
    version: string;
    commit: string;
    name: 'Avalanche';
}
export declare type WalletEventType = 'addressChanged' | 'balanceChangedX' | 'balanceChangedP';
export declare type WalletEventArgsType = iWalletAddressChanged | WalletBalanceX | AssetBalanceP;
export interface iWalletAddressChanged {
    X: string;
    P: string;
    changeX: string;
}
