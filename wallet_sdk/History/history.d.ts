import { HistoryItemType, ITransactionData } from "./types";
export declare function getAddressHistory(addrs: string[], limit: number | undefined, chainID: string, endTime?: string): Promise<ITransactionData[]>;
export declare function getTransactionSummary(tx: ITransactionData, walletAddrs: string[], evmAddress: string): Promise<HistoryItemType>;
