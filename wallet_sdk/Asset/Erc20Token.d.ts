/// <reference types="bn.js" />
import { Erc20TokenData } from "./types";
import { BN } from 'avalanche';
export default class Erc20Token {
    contract: any;
    address: any;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;
    constructor(data: Erc20TokenData);
    static getData(address: string): Promise<Erc20TokenData>;
    balanceOf(address: string): Promise<BN>;
}
