# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Core Mobile is a React Native cryptocurrency wallet application built with Expo Router. It supports multiple blockchain networks including Avalanche (AVM/PVM/C-Chain), Bitcoin, Ethereum/EVM chains, and Solana. The app integrates hardware wallets (Ledger, Keystone), seedless authentication, WalletConnect, and various DeFi features.

## Common Development Commands

### Setup
```bash
# Initial setup - fetch environment variables and Google services files (requires AWS CLI and sudo)
yarn envs

# Install dependencies and run setup scripts
yarn install && yarn setup

# Install iOS dependencies (requires cocoapods >= 1.16.2)
yarn podInstall
```

### Building & Running
```bash
# Start Metro bundler with Expo dev client
yarn start

# Run on iOS simulator (requires ENVFILE=.env.development)
yarn ios

# Run on Android emulator (requires ENVFILE=.env.development)
yarn android
```

### Testing & Quality
```bash
# Run all unit tests
yarn test

# Run a specific test file
yarn test path/to/file.test.ts

# Type checking
yarn tsc

# Linting
yarn lint
```

### Clean Build
```bash
# Clean all caches and reinstall dependencies
yarn clean
```

### E2E Testing
```bash
# Run Appium tests on iOS
yarn appium:ios

# Run Appium tests on Android
yarn appium:android

# Run smoke tests only
yarn appium:smoke
```

## Architecture

### Directory Structure

- **`app/`** - Legacy application code (gradually being migrated)
  - `store/` - Redux store with encrypted persistence (Redux Toolkit)
  - `services/` - Business logic services (balance, earn, network, wallet, etc.)
  - `hooks/` - React hooks
  - `contexts/` - React contexts (Deeplink, Delegation, EncryptedStore, Posthog, ReactQuery)
  - `utils/` - Utility functions
  - `vmModule/` - VM Module Manager for multi-chain support
  - `seedless/` - Seedless wallet integration (social sign-in)
  - `contracts/` - Smart contract ABIs and interactions

- **`app/new/`** - New application code (target architecture)
  - `App.js` - Entry point using Expo Router
  - `ContextApp.tsx` - Top-level context providers (EncryptedStore, ReactQuery, Posthog, Sentry)
  - `routes/` - Expo Router file-based routing
    - `_layout.tsx` - Root layout
    - `(signedIn)/` - Protected routes for authenticated users
    - Individual route files (signup.tsx, forgotPin.tsx, etc.)
  - `features/` - Feature-based organization (~28 features)
    - Each feature has its own screens, components, hooks, and utils
    - Examples: portfolio, bridge, browser, defiMarket, earn, ledger, etc.
  - `common/` - Shared components, hooks, and utilities
    - `components/` - Reusable UI components
    - `hooks/` - Shared hooks (e.g., send utilities)
    - `utils/` - Helper functions

### Key Architectural Patterns

**Module Manager (`app/vmModule/ModuleManager.ts`)**
- Manages blockchain-specific modules (AvalancheModule, BitcoinModule, EvmModule, SvmModule)
- Handles CAIP-2 chain ID conversion
- Routes RPC methods to appropriate modules
- Centralizes address derivation across all chains

**State Management**
- Redux with Redux Toolkit for global state
- Redux Persist with encryption (EncryptThenMac transform)
- Version-based migrations (currently v25)
- Encrypted storage key derived from user PIN
- Slice structure: app, account, network, wallet, bridge, security, notifications, etc.
- State reset on logout except `app` and `posthog` slices

**Navigation**
- Expo Router for file-based routing
- Protected routes based on `WalletState` (NONEXISTENT, LOCKED, ACTIVE)
- Route guards in `RootNavigator.tsx`
- Modal and stack navigation patterns

**Data Fetching**
- React Query (TanStack Query) for async state
- Redux RTK Query for transaction API
- Persisted queries with AsyncStorage
- Proxy URL for backend communication (set via env var)

**Module Path Aliases** (tsconfig.json and babel.config.js)
- `features/*` → `app/new/features/*`
- `common/*` → `app/new/common/*`
- `tests/*` → `tests/*`

### Environment Variables

Required for full functionality. Fetch with `yarn envs`:
- Authentication: SEEDLESS_*, GOOGLE_OAUTH_*, APPLE_OAUTH_*
- Analytics: POSTHOG_*, ANALYTICS_ENCRYPTION_KEY
- Services: PROXY_URL, GLACIER_URL, GAS_STATION_URL
- External APIs: COINBASE_APP_ID, WALLET_CONNECT_PROJECT_ID, SENTRY_DSN
- Security: BLOCKAID via PROXY_URL

See `docs/features.md` for feature-specific env requirements.

### Testing

**Unit Tests** (Jest)
- Run with `yarn test`
- Test files use `.test.ts` or `.test.tsx` extension
- Colocated with source files
- Mock setup in `__mocks__/` and `tests/` directories
- MSW for API mocking

**E2E Tests** (Appium/WebDriverIO)
- Located in `e2e-appium/`
- Smoke tests tagged with `[smoke]` or `[Smoke]`
- Platform-specific runs available

### Multi-Chain Support

The app uses VM modules to abstract blockchain-specific logic:
- **EVM Module** - Ethereum and EVM-compatible chains (EIP155 namespace)
- **Avalanche Module** - AVM (X-Chain) and PVM (P-Chain) (AVAX namespace)
- **Bitcoin Module** - Bitcoin mainnet/testnet (BIP122 namespace)
- **Solana Module** - Solana mainnet/devnet (SOLANA namespace)

Each module implements:
- Address derivation (BIP44)
- Transaction signing
- RPC method handlers
- Network-specific fee estimation

### Redux Store Structure

Key slices and their responsibilities:
- `app` - App state, wallet state, rehydration
- `account` - User accounts across chains
- `wallet` - Wallet management (mnemonic, Ledger, Keystone, seedless)
- `network` - Active/custom networks
- `bridge` - Bridge transaction state
- `security` - Security settings, biometrics
- `portfolio` - User portfolio data
- `browser` - In-app browser state
- `rpc` - RPC request handling and approvals
- `notifications` - Push notification state
- `addressBook` - Contact management
- `viewOnce` - One-time view tracking (onboarding, announcements)

## Important Notes

**Monorepo Context**
- This is a package within a monorepo at `/Users/junghwan.jang/Workspace/core-mobile`
- Workspace dependencies: `@avalabs/k2-alpine`, `react-native-nitro-avalabs-crypto`
- Shared packages use `workspace:*` protocol

**Build Configuration**
- Node >= 20.18.0, Yarn >= 3.6.4
- Java >= 17 for Android builds
- Metro bundler with custom resolvers for crypto polyfills
- Sentry integration for error tracking
- Reanimated, Skia for animations/graphics

**Security**
- Lavamoat `allowScripts` controls which packages can run install scripts
- Redux state encrypted with user-derived key
- Jailbreak detection
- Biometric authentication support

**Code Generation**
- `scripts/codegen.js` generates TypeScript types from contracts/ABIs
- OpenAPI client generation for Glacier API

**Known Issues**
- iOS build may fail if `.xcode.env.local` has invalid node binary path
- Run `yarn podInstall` after updates (handles bundle install automatically)

## React Native Performance Index

Compressed patterns with actionable detail. Apply these when writing/reviewing React Native code.

### Lists | CRITICAL
```
FlashList|import {FlashList} from '@shopify/flash-list'|required props: data, renderItem, estimatedItemSize|use getItemType={(item)=>item.type} for mixed types|keyExtractor for stable keys
ScrollView.map()|never use for >20 items|causes multi-second freeze, FPS drops to ~3|replace with FlashList
FlatList|acceptable for 20-100 items|add removeClippedSubviews={true} maxToRenderPerBatch={10} windowSize={5}|FlashList preferred
estimatedItemSize|calculate average height of items|required for FlashList recycling performance
```

### Bundle Size | CRITICAL
```
barrel-imports|NEVER import {X} from './components'|ALWAYS import X from './components/X'|barrels load ALL exports even if you use one
tree-shaking|.env: EXPO_UNSTABLE_TREE_SHAKING=1 EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1|metro.config.js: config.transformer.getTransformOptions=async()=>({transform:{experimentalImportSupport:true}})
platform-shake|import {Platform} from 'react-native' directly|NOT import * as RN|enables dead code removal per platform
date-fns|import format from 'date-fns/format'|NOT import {format} from 'date-fns'
analyze|EXPO_UNSTABLE_ATLAS=true npx expo export --platform ios && npx expo-atlas
```

### Re-renders | CRITICAL
```
react-compiler|app.json: {"expo":{"experiments":{"reactCompiler":true}}}|Expo 52+|auto-memoizes components, removes need for memo/useCallback/useMemo
zustand-selector|const filter = useStore(s=>s.filter)|only re-renders when filter changes|NOT const {filter,todos} = useContext() which re-renders on any change
jotai-atoms|const [val,setVal] = useAtom(myAtom)|each atom independent|useAtomValue for read-only, useSetAtom for write-only (no re-render)
profile|press 'j' in Metro terminal|Components tab → highlight updates on render|Profiler tab → flamegraph
```

### Animations | HIGH
```
reanimated|useSharedValue(0) not useState|useAnimatedStyle(()=>({opacity:val.value}))|runs on UI thread, smooth during JS work
reanimated|withTiming(1,{duration:500})|withSpring(1,{damping:10})|assign to sharedValue.value
animated-view|must use <Animated.View style={animatedStyle}>|regular View won't animate
never|import {Animated} from 'react-native'|blocks on JS thread|always use react-native-reanimated
defer-js|InteractionManager.runAfterInteractions(()=>heavyWork())|runs after animations complete|return task.cancel() in cleanup
reanimated4|scheduleOnUI/scheduleOnRN from react-native-worklets|replaces runOnUI/runOnJS in Reanimated 4+
```

### TextInput | HIGH
```
uncontrolled|<TextInput defaultValue={text} onChangeText={setText}/>|native owns state, no flicker
controlled|<TextInput value={text}/>|causes round-trip lag on legacy arch|only use for input masking
clear|inputRef.current?.clear()|useRef for programmatic control
```

### TTI / Startup | HIGH
```
android-mmap|android/app/build.gradle: android{androidResources{noCompress+=["bundle"]}}|enables Hermes mmap|+8% install size, -16% TTI|default in RN 0.79+
measure|npm install react-native-performance|useEffect(()=>performance.mark('screenInteractive'),[])
cold-only|only measure cold starts|filter out warm/hot/prewarmed (iOS ActivePrewarm env)|target: TTI<2s, JS bundle<500ms
```

### Native Modules | HIGH
```
threading|sync methods block JS thread, keep <16ms|async methods run on native modules thread (mqt_v_native)
ios-background|DispatchQueue.global().async{resolve(self.compute())}|moves work off JS thread
android-background|moduleScope.launch{promise?.resolve(compute())}|use CoroutineScope(Dispatchers.Default+SupervisorJob())
android-cleanup|override fun invalidate(){super.invalidate();moduleScope.cancel()}|prevents memory leak on Metro reload
```

### Memory Leaks | MEDIUM
```
useEffect-cleanup|useEffect(()=>{const sub=EventEmitter.addListener('x',fn);return()=>sub.remove()},[])
timer-cleanup|useEffect(()=>{const t=setInterval(fn,1000);return()=>clearInterval(t)},[])
closure-capture|const len=largeArray.length;return()=>len|extract primitives|NOT return()=>largeArray.length which captures entire array
```

### Quick Commands
```bash
# Profile re-renders
# press 'j' in Metro terminal

# Analyze bundle
EXPO_UNSTABLE_ATLAS=true npx expo export --platform ios && npx expo-atlas

# Check React Compiler compatibility
npx react-compiler-healthcheck@latest

# Find barrel files in codebase
grep -r "export \* from" app/
grep -r "export { .* } from" app/
```

## Common Workflows

**Adding a new feature:**
1. Create feature directory in `app/new/features/[feature-name]/`
2. Add route file in `app/new/routes/` (Expo Router handles routing)
3. Create screens, components, hooks within feature directory
4. Use shared components from `common/` where possible

**Working with blockchain transactions:**
1. Use ModuleManager to get the appropriate VM module
2. Call module methods (e.g., `signTransaction`, `sendTransaction`)
3. Handle approvals via ApprovalController
4. Update Redux state with transaction status

**Running single test:**
```bash
yarn test app/utils/FormatCurrency.test.ts
```

**Debugging:**
- Reactotron is configured for debugging Redux and MMKV
- Expo dev client includes dev menu (shake device)
- Sentry captures production errors
