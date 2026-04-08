export enum BluetoothState {
  POWERED_ON = 'PoweredOn',
  POWERED_OFF = 'PoweredOff',
  UNAUTHORIZED = 'Unauthorized',
  RESETTING = 'Resetting',
  UNSUPPORTED = 'Unsupported',
  UNKNOWN = 'Unknown'
}

export interface BluetoothAvailability {
  /** Whether the OS has granted Bluetooth permission to this app */
  hasPermission: boolean
  /** Current Bluetooth radio state */
  state: BluetoothState
}
