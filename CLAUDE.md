# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Yarn workspaces monorepo for the Ava Labs Mobile Team, containing the Core Mobile wallet application and supporting packages. The monorepo uses Yarn 3.6.4+ with workspace protocol for internal dependencies.

## Monorepo Structure

### Packages

- **`packages/core-mobile/`** - Main React Native mobile wallet application (see `packages/core-mobile/CLAUDE.md` for detailed documentation)
- **`packages/k2-alpine/`** - Mobile design system library with Storybook components
- **`packages/react-native-nitro-avalabs-crypto/`** - Native crypto module using Nitro Modules for high-performance cryptographic operations
- **`packages/eslint-mobile/`** - Shared ESLint plugin for the mobile team
- **`packages/tsconfig-mobile/`** - Shared TypeScript configuration

### Workspace Dependencies

Packages reference each other using the `workspace:*` protocol, which resolves to the local workspace version during development.

## Common Commands

### Root-Level Commands

```bash
# Install all dependencies across the monorepo
yarn install && yarn setup

# Run setup scripts for all packages
yarn setup

# Lint all packages in parallel
yarn lint

# Type-check all packages in parallel
yarn tsc

# Run tests for all packages in parallel
yarn test

# Shortcuts for core-mobile package
yarn core <COMMAND>
# Example: yarn core start && yarn core ios

# Shortcuts for k2-alpine package
yarn k2 <COMMAND>
# Example: yarn k2 storybook-generate

# Shortcuts for crypto package
yarn crypto <COMMAND>
```

### Cleanup

```bash
# Remove all node_modules folders across the monorepo
./scripts/remove-node-modules.sh

# Full clean and reinstall
./scripts/remove-node-modules.sh && yarn install && yarn setup
```

## Development Workflows

### Working on Multiple Packages

Since packages use `workspace:*` dependencies, changes to one package are immediately reflected in dependent packages without needing to rebuild or reinstall.

**Example workflow:**
1. Make changes to `k2-alpine` design system components
2. Changes are immediately available in `core-mobile` (which depends on `@avalabs/k2-alpine`)
3. No need to rebuild or reinstall unless native code changed

### Adding Dependencies

**To add a dependency to a specific package:**
```bash
# Navigate to the package
cd packages/core-mobile

# Add dependency
yarn add <package-name>
```

**To add a dependency to the root (affects all packages):**
```bash
# From root directory
yarn add -W <package-name>
```

### Working with Native Modules

The `react-native-nitro-avalabs-crypto` package contains native C++ code using Nitro Modules:

```bash
# After modifying native code or Nitrogen specs
cd packages/react-native-nitro-avalabs-crypto
yarn specs  # Regenerates native bindings

# Then rebuild the app
cd ../core-mobile
yarn podInstall  # iOS
yarn android     # Android
```

### Testing Across Packages

```bash
# Run all tests
yarn test

# Run tests for specific package
yarn workspace @avalabs/core-mobile test
yarn workspace @avalabs/k2-alpine test

# Or using shortcuts
yarn core test
yarn k2 test
```

## Important Configuration

### Node and Yarn Versions

- **Node**: >= 20.18.0
- **Yarn**: >= 3.6.4
- **Java**: >= 17 (for Android builds)

These requirements are enforced in `package.json` engines field.

### Dependency Resolutions

The root `package.json` contains extensive `resolutions` to pin specific versions across all packages and avoid conflicts, particularly for:
- Crypto libraries (`@noble/hashes`, `bip32`, `bip39`, `secp256k1`)
- React/React Native types
- Security patches (`minimist`, `shell-quote`, `plist`)

When adding new dependencies, check if they conflict with existing resolutions.

### Lavamoat Security

The monorepo uses Lavamoat's `allowScripts` to control which packages can execute install scripts, enhancing security by preventing arbitrary script execution.

## CI/CD

The monorepo uses Bitrise for CI/CD (see `bitrise.yml`):
- Android builds with Java 17 and NDK 27.1.12297006
- iOS builds with Xcode
- Detox E2E tests
- Appium smoke tests
- TestRail integration for test reporting

## Git Workflow

### Pre-commit Hooks

Husky runs `lint-staged` on commit, which:
- Lints only changed files
- Runs type checking on affected files
- Formats code with Prettier

### Branch Strategy

- **`main`** - Primary branch for production releases
- Feature branches follow pattern from commit history (e.g., `CP-11559`)

## Package-Specific Notes

### core-mobile

See `packages/core-mobile/CLAUDE.md` for comprehensive documentation on:
- App architecture (Redux, React Query, Expo Router)
- Multi-chain blockchain support
- Environment variables and secrets
- Testing strategies
- Native module integration

### k2-alpine

The design system package can be developed standalone:
```bash
cd packages/k2-alpine
yarn start  # Starts Expo dev client with Storybook
yarn storybook-generate  # Regenerates Storybook story list
```

### react-native-nitro-avalabs-crypto

High-performance crypto operations implemented in C++ using Nitro Modules framework. After modifying:
1. Update TypeScript specs in `src/specs/`
2. Run `yarn specs` to regenerate native bindings
3. Rebuild iOS/Android apps

## Key Dependencies

- **React Native**: 0.79.5
- **Expo**: 53.0.20
- **React**: 19.0.0
- **Avalanche SDKs**: Various `@avalabs/*` packages at 3.1.0-alpha.x
- **Nitro Modules**: 0.32.0 for native module architecture

## Troubleshooting

**Metro bundler issues:**
- Clear Metro cache: `yarn core start --clear`
- Regenerate Metro config: `node scripts/generate-metro-monorepo-config.js`

**Workspace resolution issues:**
- Remove all node_modules: `./scripts/remove-node-modules.sh`
- Clean install: `yarn install && yarn setup`

**iOS pod installation issues:**
- Ensure CocoaPods >= 1.16.2
- Remove Pods: `cd packages/core-mobile/ios && rm -rf Pods Podfile.lock`
- Reinstall: `cd ../.. && yarn core podInstall`

**Native module errors:**
- For crypto module: `cd packages/react-native-nitro-avalabs-crypto && yarn specs`
- Rebuild app after native changes
