# Core Mobile

## Setup dev environment

1. Set up React Native environment (https://reactnative.dev/docs/environment-setup)

2. Run `yarn envs` to fetch and create all the necessary .env files

3. Run `yarn install && yarn setup` if you haven't

## Build the app

#### For iOS

1. Install iOS dependencies:

   ```zsh
   yarn podInstall
   ```

2. Launch iOS simulator and build

   ```zsh
   yarn ios
   ```

#### For Android

Launch android emulator and build

```zsh
yarn android
```

## Common commands

```zsh
# run unit tests
yarn test

# run typescript check
yarn tsc

# run lint check
yarn lint

# fetch envs from aws and populate .env files
# do this when you first set up the project and whenever you need to sync the .env files
yarn envs
```

## Custom fonts

To add custom fonts, add it to `app/assets/fonts` folder and then run:

```zsh
yarn link
```

## Env Workflows

[Documentation](https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2500493313/Env+Workflows)

## Navigation System

[Documentation](https://whimsical.com/mobile-navigation-system-4WaXLt2DgAutCmbfFF6wpS)

## Wallet Connect Flows

[Documentation](https://whimsical.com/wallet-connect-flows-9QqTTDNdktBePx6vDR9oeX)

## App Signing

[Documentation](docs/app_signing.md)

## Release Process

[Documentation](docs/release_process.md)
