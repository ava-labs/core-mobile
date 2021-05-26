import { WalletProvider } from "./Wallet";
import HdScanner from "./HdScanner";
import HDKey from 'hdkey';
import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm';
import { iHDWalletIndex } from "./types";
export declare abstract class HDWalletAbstract extends WalletProvider {
    protected internalScan: HdScanner;
    protected externalScan: HdScanner;
    protected accountKey: HDKey;
    constructor(accountKey: HDKey);
    /**
     * Returns current index used for external address derivation.
     */
    getExternalIndex(): number;
    /**
     * Returns current index used for internal address derivation.
     */
    getInternalIndex(): number;
    /**
     * Gets the active external address on the X chain
     * - The X address will change after every deposit.
     */
    getAddressX(): string;
    /**
     * Gets the active change address on the X chain
     * - The change address will change after every transaction on the X chain.
     */
    getChangeAddressX(): string;
    /**
     * Gets the active address on the P chain
     */
    getAddressP(): string;
    /**
     * Returns every external X chain address used by the wallet up to now.
     */
    getExternalAddressesX(): string[];
    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    getInternalAddressesX(): string[];
    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    getAllAddressesX(): string[];
    getExternalAddressesP(): string[];
    /**
     * Returns every P chain address used by the wallet up to now.
     */
    getAllAddressesP(): string[];
    /**
     * Scans the network and initializes internal and external addresses on P and X chains.
     * - Heavy operation
     * - MUST use the explorer api to find the last used address
     * - If explorer is not available it will use the connected node. This may result in invalid balances.
     */
    resetHdIndices(externalStart?: number, internalStart?: number): Promise<iHDWalletIndex>;
    getUtxosX(): Promise<AVMUTXOSet>;
    getUtxosP(): Promise<PlatformUTXOSet>;
}
