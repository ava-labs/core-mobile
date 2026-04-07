export enum BluetoothState {
  POWERED_ON = 'PoweredOn',
  POWERED_OFF = 'PoweredOff',
  UNAUTHORIZED = 'Unauthorized',
  RESETTING = 'Resetting',
  UNSUPPORTED = 'Unsupported',
  UNKNOWN = 'Unknown'
}

export enum BluetoothPermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  BLOCKED = 'blocked',
  UNAVAILABLE = 'unavailable'
}
export interface BluetoothAvailability {
  /** Whether the OS has granted Bluetooth permission to this app */
  hasPermission: boolean
  /** Current Bluetooth radio state */
  state: BluetoothState
}
