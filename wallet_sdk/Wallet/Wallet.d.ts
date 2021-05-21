/// <reference types="node" />
/// <reference types="bn.js" />
import { AssetBalanceP, AssetBalanceX, AvmExportChainType, AvmImportChainType, ERC20Balance, WalletBalanceERC20, WalletBalanceX, WalletEventArgsType, WalletEventType, WalletNameType } from './types';
import { BN } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import EvmWallet from "./EvmWallet";
import { UTXOSet as AVMUTXOSet, UnsignedTx as AVMUnsignedTx, UTXO as AVMUTXO, Tx as AvmTx } from 'avalanche/dist/apis/avm';
import { UTXOSet as PlatformUTXOSet, UTXO as PlatformUTXO, UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { PayloadBase } from 'avalanche/dist/utils';
import EvmWalletReadonly from "./EvmWalletReadonly";
import EventEmitter from 'events';
export declare abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet | EvmWalletReadonly;
    abstract getAddressX(): string;
    abstract getChangeAddressX(): string;
    abstract getAddressP(): string;
    abstract getAddressC(): string;
    abstract getEvmAddressBech(): string;
    abstract getExternalAddressesX(): string[];
    abstract getInternalAddressesX(): string[];
    abstract getExternalAddressesP(): string[];
    abstract getAllAddressesX(): string[];
    abstract getAllAddressesP(): string[];
    protected emitter: EventEmitter;
    protected constructor();
    on(event: WalletEventType, listener: (...args: any[]) => void): void;
    off(event: WalletEventType, listener: (...args: any[]) => void): void;
    protected emit(event: WalletEventType, args: WalletEventArgsType): void;
    protected emitAddressChange(): void;
    protected emitBalanceChangeX(): void;
    protected emitBalanceChangeP(): void;
    /**
     * The X chain UTXOs of the wallet's current state
     */
    utxosX: AVMUTXOSet;
    /**
     * The P chain UTXOs of the wallet's current state
     */
    utxosP: PlatformUTXOSet;
    balanceX: WalletBalanceX;
    balanceERC20: WalletBalanceERC20;
    abstract signEvm(tx: Transaction): Promise<Transaction>;
    abstract signX(tx: AVMUnsignedTx): Promise<AvmTx>;
    abstract signP(tx: PlatformUnsignedTx): Promise<PlatformTx>;
    abstract signC(tx: EVMUnsignedTx): Promise<EVMTx>;
    /**
     *
     * @param to - the address funds are being send to.
     * @param amount - amount of AVAX to send in nAVAX
     * @param memo - A MEMO for the transaction
     */
    sendAvaxX(to: string, amount: BN, memo?: string): Promise<string>;
    /**
     * Sends AVAX to another address on the C chain.
     * @param to Hex address to send AVAX to.
     * @param amount Amount of AVAX to send, represented in WEI format.
     * @param gasPrice Gas price in gWEI format
     * @param gasLimit Gas limit
     *
     * @return Returns the transaction hash
     */
    sendAvaxC(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string>;
    /**
     * Makes a transfer call on a ERC20 contract.
     * @param to Hex address to transfer tokens to.
     * @param amount Amount of the ERC20 token to send, donated in the token's correct denomination.
     * @param gasPrice Gas price in gWEI format
     * @param gasLimit Gas limit
     * @param contractAddress Contract address of the ERC20 token
     */
    sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string): Promise<string>;
    /**
     * Returns the C chain AVAX balance of the wallet in WEI format.
     */
    updateAvaxBalanceC(): Promise<BN>;
    /**
     *  Returns UTXOs on the X chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosX` with new UTXOs
     *  - Calls `this.updateBalanceX()` after success.
     */
    getUtxosX(): Promise<AVMUTXOSet>;
    /**
     *  Returns UTXOs on the P chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosP` with the new UTXOs
     */
    getUtxosP(): Promise<PlatformUTXOSet>;
    /**
     * Returns the number AVAX staked by this wallet.
     */
    getStake(): Promise<BN>;
    /**
     * Requests the balance for each ERC20 contract in the SDK.
     * - Makes network requests.
     * - Updates the value of `this.balanceERC20`
     */
    updateBalanceERC20(): Promise<WalletBalanceERC20>;
    /**
     * Returns the wallet's balance of the given ERC20 contract
     * @param address ERC20 Contract address
     */
    getBalanceERC20(address: string): Promise<ERC20Balance>;
    /**
     * Uses the X chain UTXOs owned by this wallet, gets asset description for unknown assets,
     * and returns a nicely formatted dictionary that represents
     * - Updates `this.balanceX`
     * - Expensive operation if there are unknown assets
     * - Uses existing UTXOs
     * @private
     */
    private updateBalanceX;
    /**
     * Returns the X chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    getAvaxBalanceX(): AssetBalanceX;
    /**
     * Returns the P chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    getAvaxBalanceP(): AssetBalanceP;
    /**
     * Exports AVAX from P chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
    exportPChain(amt: BN): Promise<string>;
    /**
     * Exports AVAX from C chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
    exportCChain(amt: BN): Promise<string>;
    /**
     * Exports AVAX from X chain to either P or C chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @param destinationChain Which chain to export to.
     * @return returns the transaction id.
     */
    exportXChain(amt: BN, destinationChain: AvmExportChainType): Promise<string>;
    getAtomicUTXOsX(chainID: AvmImportChainType): Promise<AVMUTXOSet>;
    getAtomicUTXOsP(): Promise<PlatformUTXOSet>;
    /**
     * Imports atomic X chain utxos to the current actie X chain address
     * @param chainID The chain ID to import from, either `P` or `C`
     */
    importX(chainID: AvmImportChainType): Promise<string>;
    importP(): Promise<string>;
    importC(): Promise<string>;
    createNftFamily(name: string, symbol: string, groupNum: number): Promise<string>;
    mintNft(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number): Promise<string>;
    /**
     * Adds a validator to the network using the given node id.
     *
     * @param nodeID The node id you are adding as a validator
     * @param amt Amount of AVAX to stake in nAVAX
     * @param start Validation period start date
     * @param end Validation period end date
     * @param delegationFee Minimum 2%
     * @param rewardAddress P chain address to send staking rewards
     * @param utxos
     *
     * @return Transaction id
     */
    validate(nodeID: string, amt: BN, start: Date, end: Date, delegationFee: number, rewardAddress?: string, utxos?: PlatformUTXO[]): Promise<string>;
    delegate(nodeID: string, amt: BN, start: Date, end: Date, rewardAddress?: string, utxos?: PlatformUTXO[]): Promise<string>;
}
