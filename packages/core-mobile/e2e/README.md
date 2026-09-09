# Core Mobile Appium E2E Tests

WebdriverIO + Appium test suite for Core Mobile. Runs locally against an iOS
simulator / Android emulator (or physical device) and on AWS Device Farm.

## Running locally

From `packages/core-mobile`:

```bash
yarn appium:ios          # iOS only
yarn appium:android      # Android only
yarn appium:smoke        # [Smoke]-tagged specs on all detected platforms
yarn appium:smokeIos     # [Smoke]-tagged specs, iOS only
yarn appium:smokeAndroid # [Smoke]-tagged specs, Android only
yarn appium              # all detected platforms
```

WDIO starts Appium itself. If you prefer to run your own Appium server on
`localhost:4723`, set `APPIUM_MANUAL=true`.

Local devices are auto-detected via `adb` / `xcrun simctl`
(see `helpers/resolve-local-device.ts`); use the device variables below to pin
a specific one.

### Which app binary is used

The app path is resolved in this order (`wdio.conf.ts`):

1. `AWS_DEVICE_FARM_APP_PATH` — set by Device Farm
2. `APP_PATH` — explicit path, applies to whichever platform(s) you run
3. `E2E_LOCAL_PATH` — path to a downloaded e2e/release build (`.app` or `.apk`).
   Setting this also tells the page objects the build is a release build, so
   the Metro dev-menu dismissal is skipped.
4. Default local debug build outputs:
   - iOS: `./ios/build/Debug-iphonesimulator/AvaxWalletInternal.app`
   - Android: `./android/app/build/outputs/apk/internal/debug/app-internal-debug.apk`

### Building the app for the default paths

Produce the debug bundles at exactly the default locations above:

```bash
yarn appium:build:ios      # xcodebuild → ios/build/Debug-iphonesimulator/AvaxWalletInternal.app
yarn appium:build:android  # gradle → android/app/build/outputs/apk/internal/debug/app-internal-debug.apk
```

(`yarn ios` builds into Xcode's DerivedData instead, so its output is NOT picked
up by the default path — use `APP_PATH` if you want to reuse that build.
Don't delete `ios/build/` wholesale: RN codegen writes generated sources to
`ios/build/generated/`; if you did, re-run `yarn podInstall` to regenerate.)

These are Debug dev-client builds: **Metro must be running** (`yarn start`)
while the tests execute. To run against a standalone release build instead,
download an e2e binary from Bitrise and set `E2E_LOCAL_PATH` to it.

## Environment variables

### Test wallet (required)

| Variable | Required | Purpose |
| --- | --- | --- |
| `E2E_MNEMONIC` | Yes (all mnemonic-based specs) | Recovery phrase of the funded test wallet. `warmup()` throws if unset. |
| `E2E_PK` | For `settings/importWallet.spec.ts` | Private key imported/verified in the import-wallet spec. |
| `E2E_METAMASK_MNEMONIC` | For `settings/importWallet.spec.ts` and `onboarding/metaMaskWallet.spec.ts` | Secondary (MetaMask-style) recovery phrase. |

### TestRail reporting

| Variable | Required | Purpose |
| --- | --- | --- |
| `TESTRAIL_API_KEY` | Yes | The WDIO hooks create a TestRail run and push a result for every test (`testrail/testrail.config.ts`). |

### Seedless specs

| Variable | Required | Purpose |
| --- | --- | --- |
| `IS_SEEDLESS` | `true` to onboard via seedless instead of mnemonic | Switches `warmup()` to the seedless flow. |
| `TEST_OIDC_PRIVATE_KEY` | With `IS_SEEDLESS` | RS256 private key used to mint the test OIDC id token. |
| `TEST_OIDC_ISSUER` | With `IS_SEEDLESS` | `iss` claim. |
| `TEST_OIDC_AUDIENCE` | With `IS_SEEDLESS` | `aud` claim. |
| `TEST_OIDC_SUB` | Optional | `sub` claim. |

### Run selection

| Variable | Purpose |
| --- | --- |
| `PLATFORM` | `ios` or `android`. Unset = run every platform with a detected device. |
| `TEST_TYPE` | `smoke` or `performance` (also selects the TestRail run type). |
| `IS_SMOKE` | `true` — same as `TEST_TYPE=smoke` (the `appium:smoke*` scripts set it). |
| `IS_PERFORMANCE` | `true` — run only `specs/performance/**`. |
| `IS_SEEDLESS_TRANSACTIONS` | `true` — run only `specs/transactions/**`. |

### Local device selection

| Variable | Purpose |
| --- | --- |
| `ANDROID_SERIAL` | Pick a specific `adb` device/emulator. |
| `ADB_PATH` | Path to `adb` if not on `PATH`/`ANDROID_HOME`. |
| `IOS_UDID` | Pick a specific simulator/device by UDID. |
| `IOS_DEVICE_NAME`, `IOS_PLATFORM_VERSION` | Target a physical iOS device by name/version. |
| `XCODE_ORG_ID` | Development team id — required to sign WebDriverAgent for physical iOS devices. |
| `APPIUM_MANUAL` | `true` = don't start Appium from WDIO; connect to your own server. |
| `E2E` | `true` when the app itself was built in E2E mode (skips Metro dev-menu handling entirely). |

### AWS Device Farm (provided by the Device Farm host / test spec)

`AWS_DEVICE_FARM_APPIUM_SERVER_URL`, `AWS_DEVICE_FARM_APP_PATH`,
`DEVICEFARM_DEVICE_NAME`, `DEVICEFARM_DEVICE_OS_VERSION`,
`DEVICEFARM_DEVICE_UDID`, `DEVICEFARM_DEVICE_PLATFORM_NAME`,
`DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR`. The Device Farm config
(`wdio.devicefarm.conf.ts`) additionally honors `SPEC_FILE` (run a single spec
file), `WDA_DERIVED_DATA_PATH` and `XCODE_CONFIG_FILE`. Packaging and upload
scripts live in [`../scripts/devicefarm/`](../scripts/devicefarm/)
(`package-tests.sh`, `test.js`).

## Wallet funding requirements

The `E2E_MNEMONIC` wallet needs **at least two accounts** ("Account 2" with
address `0xE7B7...5293` is the send/NFT recipient, so funds stay inside the
wallet and only gas is burned). Keep the following balances on **Account 1**;
the amounts below are per full run — fund a comfortable multiple so repeated
runs don't drain the wallet.

### Avalanche C-Chain (mainnet)

| Asset | Used by | Per-run usage |
| --- | --- | --- |
| AVAX | sends (`0.0001`), quick swap (`0.01`), swaps (`0.01` + trending-token swap `0.001`), earn deposits (`0.0001` × aave, benqi, borrow collateral), all gas | keep ≥ 0.5 AVAX |
| COQ | ERC20 send (`0.0001`) | keep ≥ 1 COQ |
| USDC | swaps USDC→AVAX (`0.1`) and USDC→USDT (`0.1`) | keep ≥ 1 USDC |

The Earn specs (`transactions/earn/`) deposit, borrow, repay and withdraw AVAX
on both the **Aave** and **Benqi** pools — both pools run on every execution.

### Ethereum (mainnet)

| Asset | Used by | Per-run usage |
| --- | --- | --- |
| ETH | send (`0.0001`) + gas | keep enough for L1 gas (≥ 0.01 ETH recommended) |
| WETH | ERC20 send (`0.0001`) | keep ≥ 0.001 WETH |

### Solana (mainnet)

| Asset | Used by | Per-run usage |
| --- | --- | --- |
| SOL | send (`0.0009`), swap SOL→USDC (`0.0001`) + fees | keep ≥ 0.05 SOL |
| USDC (SPL) | swaps USDC→SOL (`0.001`) and USDC→JUP (`0.001`) | keep ≥ 1 USDC |
| JUP (SPL) | SPL send (`0.0009`) | keep ≥ 1 JUP |

### Avalanche P-Chain / X-Chain (mainnet)

| Asset | Used by | Per-run usage |
| --- | --- | --- |
| AVAX on P-Chain | send (`0.0001`) + fee | keep ≥ 0.1 AVAX |
| AVAX on X-Chain | send (`0.0001`) + fee | keep ≥ 0.1 AVAX |

### Testnet (Fuji)

| Asset | Used by | Per-run usage |
| --- | --- | --- |
| AVAX (Fuji C-Chain) | `stakeTestnet.spec.ts` stakes `1` AVAX for 1 day | keep ≥ 2 AVAX (faucet) |

### NFTs (currently skipped specs)

`sendNft.spec.ts` (C-Chain, collectible named `ABC`) and
`sendEthNft.spec.ts` (Ethereum, collectible named `Untitled`) are `describe.skip`
but expect those collectibles in the wallet when re-enabled. NFTs are sent to
Account 2, so they alternate between accounts across runs.

### No funding needed

Buy/onramp (`buy.spec.ts`, Meld) and withdraw/offramp specs stop before any
real payment; browser, settings, onboarding and portfolio specs are read-only.
