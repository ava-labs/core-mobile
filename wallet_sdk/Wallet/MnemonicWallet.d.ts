import EvmWallet from './EvmWallet';
import { WalletNameType } from './types';
import { Transaction } from '@ethereumjs/tx';
import { Tx as AVMTx, UnsignedTx as AVMUnsignedTx } from 'avalanche/dist/apis/avm';
import { Tx as PlatformTx, UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { HDWalletAbstract } from "./HDWalletAbstract";
export default class MnemonicWallet extends HDWalletAbstract {
    evmWallet: EvmWallet;
    type: WalletNameType;
    mnemonic: string;
    private ethAccountKey;
    constructor(mnemonic: string);
    /**
     * Gets the active address on the C chain in Bech32 encoding
     * @return
     * Bech32 representation of the EVM address.
     */
    getEvmAddressBech(): string;
    /**
     * Generates a 24 word mnemonic phrase and initializes a wallet instance with it.
     * @return Returns the initialized wallet.
     */
    static create(): MnemonicWallet;
    /**
     * Returns a new 24 word mnemonic key phrase.
     */
    static generateMnemonicPhrase(): string;
    /**
     * Returns a new instance of a Mnemonic wallet from the given key phrase.
     * @param mnemonic The 24 word mnemonic phrase of the wallet
     */
    static fromMnemonic(mnemonic: string): MnemonicWallet;
    /**
     * Signs an EVM transaction on the C chain.
     * @param tx The unsigned transaction
     */
    signEvm(tx: Transaction): Promise<Transaction>;
    /**
     * Signs an AVM transaction.
     * @param tx The unsigned transaction
     */
    signX(tx: AVMUnsignedTx): Promise<AVMTx>;
    /**
     * Signs a PlatformVM transaction.
     * @param tx The unsigned transaction
     */
    signP(tx: PlatformUnsignedTx): Promise<PlatformTx>;
    /**
     * Signs a C chain transaction
     * @remarks
     * Used for Import and Export transactions on the C chain. For everything else, use `this.signEvm()`
     * @param tx The unsigned transaction
     */
    signC(tx: EVMUnsignedTx): Promise<EVMTx>;
    /**
     * Returns a keychain with the keys of every derived X chain address.
     * @private
     */
    private getKeyChainX;
    /**
     * Returns a keychain with the keys of every derived P chain address.
     * @private
     */
    private getKeyChainP;
    /**
     * Gets the active address on the C chain
     * @return
     * Hex representation of the EVM address.
     */
    getAddressC(): string;
    signMessage(msgStr: string, index: number): string;
}
