import { Socket } from 'avalanche';
import { NetworkConfig } from './types';
import Web3 from 'web3';
export declare let socketX: Socket;
export declare let socketEVM: Web3;
export declare function setSocketNetwork(config: NetworkConfig): void;
export declare function updateFilterAddresses(): void;
