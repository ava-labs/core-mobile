# Ledger Integration Documentation

This directory contains documentation for the current Ledger device integration in Core Mobile.

## Contents

1. [Ledger Connection Flow](./ledger-connection.md)
   - Device discovery and connection
   - Account setup process
   - Error handling

2. [Transaction Signing Flow](./transaction-signing.md)
   - Transaction signing overview
   - Chain-specific implementations
   - Error handling

## Key Components

### Services
- `LedgerService`: Manages device connection and app detection
- `LedgerWallet`: Implements wallet interface for Ledger devices
- `WalletService`: Coordinates transaction signing across wallet types

### Hooks
- `useLedgerWallet`: React hook for Ledger device management

### UI Components
- `ConnectWallet`: Device discovery and connection UI
- `ConfirmAddresses`: Account setup and verification UI

## Dependencies

- `@ledgerhq/react-native-hw-transport-ble`: Bluetooth transport
- `@ledgerhq/hw-app-solana`: Solana app integration
- `@avalabs/hw-app-avalanche`: Avalanche app integration
- `@ledgerhq/hw-app-eth`: Ethereum app integration

## Implementation Notes

1. **Bluetooth Connectivity**
   - Uses BLE for device communication
   - Implements connection monitoring
   - Handles connection recovery

2. **Multi-Chain Support**
   - Supports EVM, Solana, and Avalanche chains
   - Handles app switching
   - Manages different transaction formats

3. **Security Considerations**
   - Implements secure device pairing
   - Validates addresses and transactions
   - Handles sensitive data appropriately

4. **Error Handling**
   - Comprehensive error types
   - User-friendly error messages
   - Recovery procedures

## Recent Updates

- Successfully implemented legacy transaction format for EVM chains
- Added proper RLP encoding for transactions
- Implemented correct signature handling
- Added connection monitoring and recovery
