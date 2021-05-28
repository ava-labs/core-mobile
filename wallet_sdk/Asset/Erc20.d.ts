import { Erc20Store, Erc20TokenData } from "./types";
import Erc20Token from "./Erc20Token";
import { WalletBalanceERC20 } from "../Wallet/types";
export declare let erc20Store: Erc20Store;
export declare function addErc20Token(address: string): Promise<Erc20Token>;
export declare function getContractData(address: string): Promise<Erc20TokenData>;
export declare function getErc20Token(address: string): Promise<Erc20Token>;
export declare function balanceOf(address: string): Promise<WalletBalanceERC20>;
