import {WrapStatus} from '@avalabs/bridge-sdk';

export enum BridgeEvents {
  BRIDGE_CONFIG_UPDATE_EVENT = 'bridge_config_update_event',
  BRIDGE_TRANSFER_EVENT = 'bridge_transfer_event',
}

export enum TransferEventType {
  WRAP_STATUS = 'wrap_status',
  TX_HASH = 'tx_hash',
}

export type TransferEvent =
  | {
      type: TransferEventType.WRAP_STATUS;
      status: WrapStatus;
    }
  | {
      type: TransferEventType.TX_HASH;
      txHash: string;
    };
