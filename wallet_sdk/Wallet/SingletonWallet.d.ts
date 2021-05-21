import { WalletProvider } from "./Wallet";
import { WalletNameType } from "./types";
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { Buffer as BufferAvalanche } from 'avalanche';
import EvmWallet from "./EvmWallet";
import { UnsignedTx, Tx } from 'avalanche/dist/apis/evm';
import { Transaction } from '@ethereumjs/tx';
export default class SingletonWallet extends WalletProvider {
    type: WalletNameType;
    key: string;
    keyBuff: BufferAvalanche;
    evmWallet: EvmWallet;
    /**
     *
     * @param privateKey An avalanche private key, starts with `PrivateKey-`
     */
    constructor(privateKey: string);
    static fromEvmKey(key: string): SingletonWallet;
    private getKeyChainX;
    private getKeyChainP;
    getAddressC(): string;
    getAddressP(): string;
    getAddressX(): string;
    getAllAddressesP(): string[];
    getAllAddressesX(): string[];
    getChangeAddressX(): string;
    getEvmAddressBech(): string;
    getExternalAddressesP(): string[];
    getExternalAddressesX(): string[];
    getInternalAddressesX(): string[];
    signC(tx: UnsignedTx): Promise<Tx>;
    signEvm(tx: Transaction): Promise<Transaction>;
    signP(tx: PlatformUnsignedTx): Promise<PlatformTx>;
    signX(tx: AVMUnsignedTx): Promise<AVMTx>;
}
