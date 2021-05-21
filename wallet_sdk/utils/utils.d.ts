/// <reference types="bn.js" />
/// <reference types="node" />
import Big from 'big.js';
import { BN } from 'avalanche';
/**
 * @param val the amount to parse
 * @param denomination number of decimal places to parse with
 */
export declare function bnToBig(val: BN, denomination?: number): Big;
/**
 * Parses the value using a denomination of 18
 *
 * @param val the amount to parse given in WEI
 *
 * @example
 * ```
 * bnToAvaxC(new BN('22500000000000000000')
 * // will return  22.5
 *```
 *
 */
export declare function bnToAvaxC(val: BN): string;
/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export declare function bnToAvaxX(val: BN): string;
/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export declare function bnToAvaxP(val: BN): string;
/**
 *
 * @param val the number to parse
 * @param decimals number of decimal places used to parse the number
 */
export declare function numberToBN(val: number | string, decimals: number): BN;
/**
 * @Remarks
 * A helper method to convert BN numbers to human readable strings.
 *
 * @param val The amount to convert
 * @param decimals Number of decimal places to parse the amount with
 *
 * @example
 * ```
 * bnToLocaleString(new BN(100095),2)
 * // will return '1,000.95'
 * ```
 */
export declare function bnToLocaleString(val: BN, decimals?: number): string;
/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current USD price of 1 AVAX
 */
export declare function getAvaxPrice(): Promise<number>;
/**
 * Checks if address is valid.
 *
 * @return
 * boolean if address is valid, error message if not valid.
 */
export declare function isValidAddress(address: string): boolean | string;
export declare function digestMessage(msgStr: string): Buffer;
export declare function waitTxX(txId: string, tryCount?: number): Promise<string>;
export declare function waitTxP(txId: string, tryCount?: number): Promise<string>;
export declare function waitTxEvm(txHash: string, tryCount?: number): Promise<string>;
export declare function waitTxC(cAddress: string, nonce?: number, tryCount?: number): Promise<string>;
