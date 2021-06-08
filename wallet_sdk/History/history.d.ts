import { HistoryItemType, iHistoryEVMTx, ITransactionData, ITransactionDataEVM } from "./types";
/**
 * Returns transactions FROM and TO the address given
 * @param addr The address to get historic transactions for.
 */
export declare function getAddressHistoryEVM(addr: string): Promise<ITransactionDataEVM[]>;
export declare function getAddressHistory(addrs: string[], limit: number | undefined, chainID: string, endTime?: string): Promise<ITransactionData[]>;
export declare function getTransactionSummary(tx: ITransactionData, walletAddrs: string[], evmAddress: string): Promise<HistoryItemType>;
export declare function getTransactionSummaryEVM(tx: ITransactionDataEVM, walletAddress: string): iHistoryEVMTx;
