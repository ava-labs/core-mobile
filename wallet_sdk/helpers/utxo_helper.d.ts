/// <reference types="bn.js" />
import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm/utxos';
import { BN } from 'avalanche';
import { AvmImportChainType } from "../Wallet/types";
/**
 *
 * @param addrs an array of X chain addresses to get the atomic utxos of
 * @param chainID Which chain to check agains, either `P` or `C`
 */
export declare function avmGetAtomicUTXOs(addrs: string[], chainID: AvmImportChainType): Promise<AVMUTXOSet>;
export declare function platformGetAtomicUTXOs(addrs: string[]): Promise<PlatformUTXOSet>;
export declare function getStakeForAddresses(addrs: string[]): Promise<BN>;
export declare function avmGetAllUTXOs(addrs: string[]): Promise<AVMUTXOSet>;
export declare function avmGetAllUTXOsForAddresses(addrs: string[], endIndex?: any): Promise<AVMUTXOSet>;
export declare function platformGetAllUTXOs(addrs: string[]): Promise<PlatformUTXOSet>;
export declare function platformGetAllUTXOsForAddresses(addrs: string[], endIndex?: any): Promise<PlatformUTXOSet>;
