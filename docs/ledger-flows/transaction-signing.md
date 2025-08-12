# Ledger Transaction Signing Flow

This document describes the current implementation of Ledger transaction signing in Core Mobile.

## Transaction Signing Overview

### Flow Diagram

```mermaid
sequenceDiagram
    box User Interface
    participant User
    end
    box Core Mobile
    participant App
    end
    box External Systems
    participant Ledger
    participant Network
    end
    
    User->>App: Initiate Transaction
    
    Note over App: Prepare Transaction Data
    
    Note over App,Ledger: Connection Check Phase
    App->>Ledger: Check Connection
    
    alt Device Disconnected
        Ledger-->>App: Not Connected
        App->>Ledger: Reconnect
    end
    
    Note over App,Ledger: App Verification Phase
    App->>Ledger: Check Correct App
    
    alt Wrong App
        Ledger-->>App: Wrong App
        App-->>User: Prompt App Switch
        User->>Ledger: Switch App
    end
    
    Note over App,Ledger: Transaction Signing Phase
    App->>Ledger: Send Transaction for Signing
    Ledger-->>User: Show Transaction Details
    User->>Ledger: Approve Transaction
    Ledger-->>App: Return Signature
    
    Note over App,Network: Submission Phase
    App->>Network: Submit Signed Transaction
    Network-->>App: Transaction Result
    App-->>User: Show Result
```

## Chain-Specific Implementations

### EVM Transaction Signing

```mermaid
sequenceDiagram
    box Core Mobile
    participant App
    end
    box External Systems
    participant Ledger
    participant Chain
    end
    
    Note over App,Ledger: Connection Setup Phase
    App->>Ledger: Ensure Connection
    App->>Ledger: Wait for Ethereum App
    App->>Ledger: Get Transport
    
    Note over App,Ledger: Address Verification Phase
    App->>Ledger: Get Derivation Path
    App->>Ledger: Verify Address
    Ledger-->>App: Address Confirmed
    
    Note over App: Transaction Preparation Phase
    Note over App: Format Legacy Transaction
    Note over App: Convert EIP-1559 to Legacy
    
    Note over App,Chain: Signing & Submission Phase
    App->>Ledger: Sign Transaction
    Ledger-->>App: Return r, s, v Components
    Note over App: Concatenate Signature
    App->>Chain: Submit Transaction
```

### Solana Transaction Signing

```mermaid
sequenceDiagram
    box Core Mobile
    participant App
    end
    box External Systems
    participant Ledger
    participant Chain
    end
    
    Note over App,Ledger: Initial Setup Phase
    App->>Ledger: Ensure Connection
    App->>Ledger: Wait for Solana App
    App->>Ledger: Get Transport
    App->>Ledger: Create AppSolana Instance
    
    Note over App,Ledger: Address Verification Phase
    App->>Ledger: Get Derivation Path
    App->>Ledger: Verify Address
    Ledger-->>App: Address Confirmed
    
    Note over App: Transaction Preparation Phase
    Note over App: Deserialize Transaction
    Note over App: Compile Transaction
    
    Note over App,Chain: Signing & Submission Phase
    App->>Ledger: Sign Transaction
    Ledger-->>App: Return Signature
    Note over App: Serialize Signed Transaction
    App->>Chain: Submit Transaction
```

## Error Handling

### Flow Diagram

```mermaid
stateDiagram-v2
    direction LR
    
    [*] --> ConnectionCheck
    
    state "Connection Check" as ConnectionCheck {
        [*] --> Checking
        Checking --> Connected
        Checking --> Disconnected
        Disconnected --> Reconnecting
        Reconnecting --> Checking
    }
    
    state "App Verification" as AppVerification {
        [*] --> Verifying
        Verifying --> CorrectApp
        Verifying --> WrongApp
        WrongApp --> SwitchApp
        SwitchApp --> Verifying
    }
    
    state "Transaction Signing" as TransactionSigning {
        [*] --> Preparing
        Preparing --> ReadyToSign
        ReadyToSign --> Signing
        Signing --> Signed
        Signing --> Failed
    }
    
    ConnectionCheck --> AppVerification: Connected
    AppVerification --> TransactionSigning: CorrectApp
    TransactionSigning --> [*]: Signed
    
    state "Error Recovery" as ErrorRecovery {
        [*] --> IdentifyError
        IdentifyError --> ShowError
        ShowError --> RecoverySteps
        RecoverySteps --> [*]
    }
    
    Disconnected --> ErrorRecovery
    WrongApp --> ErrorRecovery
    Failed --> ErrorRecovery
    
    ErrorRecovery --> ConnectionCheck: Retry
```

### Error Types

1. **Connection Errors**
- Device disconnected
- Connection timeout
- Transport error

2. **App Errors**
- Wrong app open
- App not responding
- Version mismatch

3. **Transaction Errors**
- Invalid format
- Preparation failed
- Signing failed
- Processing failed

4. **Validation Errors**
- Address mismatch
- Chain mismatch
- Parameter validation

Each error type includes specific error messages and recovery steps to guide users through the process.