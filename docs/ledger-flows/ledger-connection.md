# Ledger Connection Flow

This document describes the current implementation of Ledger device connection and account setup in Core Mobile.

## Device Discovery and Connection

### Flow Diagram

```mermaid
sequenceDiagram
    box User Interface
    participant User
    end
    box Core Mobile
    participant App
    end
    box External Devices
    participant BLE
    participant Ledger
    end
    
    User->>App: Initiate Add Ledger
    App->>BLE: Check Bluetooth Status
    
    alt Bluetooth Disabled
        BLE-->>App: Status: Disabled
        App-->>User: Show Enable Bluetooth Prompt
        User->>BLE: Enable Bluetooth
    end
    
    App->>BLE: Request Permissions
    
    alt Permissions Denied
        BLE-->>App: Permission Denied
        App-->>User: Show Permission Request
        User->>BLE: Grant Permissions
    end
    
    App->>BLE: Start Device Scan
    BLE->>Ledger: Discover Devices
    Ledger-->>BLE: Device Info
    BLE-->>App: Available Devices
    App-->>User: Display Device List
    
    Note over User,App: User selects device from list
    
    User->>App: Select Device
    App->>Ledger: Initiate Connection
    Ledger-->>App: Connection Established
    App-->>User: Show Success & Continue
```

## Account Setup Flow

### Flow Diagram

```mermaid
sequenceDiagram
    box User Interface
    participant User
    end
    box Core Mobile
    participant App
    participant Store
    end
    box External Device
    participant Ledger
    end
    
    User->>App: Continue to Address Setup
    
    Note over App,Ledger: Solana Setup Phase
    App->>Ledger: Request Solana App
    Ledger-->>User: Prompt: Open Solana App
    User->>Ledger: Open Solana App
    App->>Ledger: Get Solana Keys
    Ledger-->>App: Solana Public Keys
    
    Note over App,Ledger: Avalanche Setup Phase
    App->>Ledger: Request Avalanche App
    Ledger-->>User: Prompt: Open Avalanche App
    User->>Ledger: Open Avalanche App
    App->>Ledger: Get Avalanche Keys
    Ledger-->>App: Avalanche Public Keys
    
    Note over App,Store: Storage Phase
    App->>Store: Create Wallet Entry
    Store-->>App: Wallet Created
    App->>Store: Create Account Entry
    Store-->>App: Account Created
    
    App-->>User: Show Success
```

## Error Handling

### Flow Diagram

```mermaid
stateDiagram-v2
    direction LR
    
    [*] --> CheckBluetooth
    
    state "Bluetooth Check" as CheckBluetooth {
        [*] --> Checking
        Checking --> Available
        Checking --> Disabled
        Disabled --> Settings
        Settings --> Checking
    }
    
    state "Permission Check" as PermissionCheck {
        [*] --> Requesting
        Requesting --> Granted
        Requesting --> Denied
        Denied --> RequestAgain
        RequestAgain --> Requesting
    }
    
    state "Device Connection" as DeviceConnection {
        [*] --> Scanning
        Scanning --> Found
        Scanning --> NotFound
        Found --> Connecting
        Connecting --> Connected
        Connecting --> Failed
    }
    
    CheckBluetooth --> PermissionCheck: Available
    PermissionCheck --> DeviceConnection: Granted
    DeviceConnection --> [*]: Connected
    
    state "Error Recovery" as ErrorRecovery {
        [*] --> IdentifyError
        IdentifyError --> ShowMessage
        ShowMessage --> RecoverySteps
        RecoverySteps --> [*]
    }
    
    Disabled --> ErrorRecovery
    Denied --> ErrorRecovery
    Failed --> ErrorRecovery
    NotFound --> ErrorRecovery
    
    ErrorRecovery --> CheckBluetooth: Retry
```

### Error Types and Handling

1. **Bluetooth Errors**
- Bluetooth unavailable
- Bluetooth disabled
- Permission denied

2. **Connection Errors**
- Device not found
- Connection timeout
- Pairing removed
- Connection lost

3. **App Errors**
- App not open
- Wrong app open
- App version mismatch

Each error type has specific handling and user messaging to guide through recovery steps.