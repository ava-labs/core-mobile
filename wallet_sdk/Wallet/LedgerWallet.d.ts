import Eth from '@ledgerhq/hw-app-eth';
import AppAvax from '@obsidiansystems/hw-app-avalanche';
import HDKey from 'hdkey';
import { ChainAlias, ILedgerAppConfig, WalletNameType } from "./types";
import { Transaction } from '@ethereumjs/tx';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { Credential } from 'avalanche/dist/common';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { HDWalletAbstract } from "./HDWalletAbstract";
import EvmWalletReadonly from "./EvmWalletReadonly";
import { ChainIdType } from "../types";
export default class LedgerWallet extends HDWalletAbstract {
    evmWallet: EvmWalletReadonly;
    type: WalletNameType;
    evmAccount: HDKey;
    config: ILedgerAppConfig;
    appAvax: AppAvax;
    ethApp: Eth;
    constructor(avaxAcct: HDKey, evmAcct: HDKey, avaxApp: AppAvax, ethApp: Eth, config: ILedgerAppConfig);
    /**
     * Create a new ledger wallet instance from the given transport
     * @param transport
     */
    static fromTransport(transport: any): Promise<LedgerWallet>;
    static getAvaxAccount(app: AppAvax): Promise<HDKey>;
    static getEvmAccount(eth: Eth): Promise<HDKey>;
    static fromApp(app: AppAvax, eth: Eth): Promise<LedgerWallet>;
    getAddressC(): string;
    getEvmAddressBech(): string;
    signEvm(tx: Transaction): Promise<Transaction>;
    getTransactionPaths<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx>(unsignedTx: UnsignedTx, chainId: ChainIdType): {
        paths: string[];
        isAvaxOnly: boolean;
    };
    getPathFromAddress(address: string): string;
    signX(unsignedTx: AVMUnsignedTx): Promise<AVMTx>;
    getChangePath(chainId?: ChainAlias): string;
    getChangeIndex(chainId?: ChainAlias): number;
    getChangeBipPath<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx>(unsignedTx: UnsignedTx, chainId: ChainIdType): any;
    signTransactionParsable<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx, SignedTx extends AVMTx | PlatformTx | EVMTx>(unsignedTx: UnsignedTx, paths: string[], chainId: ChainIdType): Promise<SignedTx>;
    signTransactionHash<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx, SignedTx extends AVMTx | PlatformTx | EVMTx>(unsignedTx: UnsignedTx, paths: string[], chainId: ChainIdType): Promise<SignedTx>;
    pathsToUniqueBipPaths(paths: string[]): any[];
    getCredentials<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx>(unsignedTx: UnsignedTx, paths: string[], sigMap: any, chainId: ChainIdType): Credential[];
    signP(unsignedTx: PlatformUnsignedTx): Promise<PlatformTx>;
    signC(unsignedTx: EVMUnsignedTx): Promise<EVMTx>;
}
