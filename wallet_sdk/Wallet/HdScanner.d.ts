import HDKey from 'hdkey';
import { KeyPair as AVMKeyPair, KeyChain as AVMKeyChain } from 'avalanche/dist/apis/avm/keychain';
import { KeyChain as PlatformKeyChain, KeyPair as PlatformKeyPair } from 'avalanche/dist/apis/platformvm';
import { HdChainType } from './types';
declare type AddressCache = {
    [index: string]: HDKey;
};
declare type KeyCacheX = {
    [index: string]: AVMKeyPair;
};
declare type KeyCacheP = {
    [index: string]: PlatformKeyPair;
};
export default class HdScanner {
    protected index: number;
    protected addressCache: AddressCache;
    protected keyCacheX: KeyCacheX;
    protected keyCacheP: KeyCacheP;
    readonly changePath: string;
    readonly accountKey: HDKey;
    constructor(accountKey: HDKey, isInternal?: boolean);
    getIndex(): number;
    increment(): number;
    getAddressX(): string;
    getAddressP(): string;
    getAllAddresses(chainId?: HdChainType): string[];
    getAddressesInRange(start: number, end: number): string[];
    getKeyChainX(): AVMKeyChain;
    getKeyChainP(): PlatformKeyChain;
    getKeyForIndexX(index: number): AVMKeyPair;
    getKeyForIndexP(index: number): PlatformKeyPair;
    private getHdKeyForIndex;
    private getAddressForIndex;
    resetIndex(): Promise<void>;
    private findAvailableIndexExplorer;
    private findAvailableIndexNode;
}
export {};
