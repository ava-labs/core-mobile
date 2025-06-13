# New Encryption Key Storage Model

Introduced a more secure and flexible key management system by using a master "Encryption Key". This key is responsible for encrypting all wallet secrets (mnemonics and private keys), which provides a single point of control and allows for smoother multi-wallet operations without repeated user prompts.

- **Master Encryption Key**:

  - A new, persistent Encryption Key is generated to encrypt all individual wallet secrets, which are then stored in the device's Keychain.
  - This key is held in-memory for the duration of an active app session, allowing seamless unlocking of any wallet managed by the app without repeated prompts.

- **Dual-Storage for Encryption Key**: The Encryption Key itself is stored securely using two methods to support both PIN and biometric authentication:

  - **PIN-based Storage**: The Encryption Key is encrypted with the user's PIN and stored in the Keychain. This is the primary, recoverable storage method.
  - **Biometric Storage**: If the user enables biometrics, the raw (unencrypted) Encryption Key is also stored in the device's secure biometric storage for quick, passwordless unlocking.

- **Migration Paths for Existing Users**: To support the new Encryption Key model, existing users will be migrated through one of the following paths, depending on their setup:
  - **Initial Login with PIN**: For users without biometrics enabled, the first login with a PIN triggers the full migration. The app decrypts the existing mnemonic, generates a new master Encryption Key, and stores it in two places: encrypted with the PIN in the Keychain, and raw in biometric storage (if the user enables it later). The wallet secret is then re-encrypted with this new key.
  - **Initial Login with Biometrics**: For users with biometrics enabled, the first login uses biometrics to access the raw mnemonic. A new master Encryption Key is generated and stored _only_ in the secure biometric storage. The wallet's secret is re-encrypted with this key. This creates a temporary, partially migrated state.
  - **Completing the Migration**: A user in a partially migrated state (having only logged in with biometrics) will be prompted to enter their PIN to complete the migration in the following scenarios:
    - **Logging in with PIN**: A subsequent login using the PIN.
    - **Disabling Biometrics**: If the user disables biometrics within the app's settings.
    - **Importing a New Wallet**: When attempting to create or import a new wallet.
      Completing the migration ensures the master Encryption Key is also stored in its PIN-encrypted form in the Keychain.
