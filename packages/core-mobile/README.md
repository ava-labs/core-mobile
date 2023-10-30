# Core X Mobile

## Setup dev environment

Follow [these](https://reactnative.dev/docs/environment-setup) steps to setup dev environment; make sure to select
**React Native CLI Quickstart** tab and select appropriate Development & Target OS.

## Getting Started

### 1. Clone the repo.

```zsh
git clone git@github.com:ava-labs/avalanche-wallet-apps.git
cd avalanche-wallet-apps/
```

**NOTE:** If you're using IDE to initiate this action you will need `github access token` registered with Jumpcloud SSO.
To do that, go to  https://github.com/settings/tokens, generate access token and authorize it with Jumpcloud. Finally, import that token to your favorite IDE.

### 2. Setup environment.
1. To access all project's dependencies you will need to generate an `NPM token` from your npmjs account and add that as an environment variable named `NPM_TOKEN` on your mac (for example, `.zshenv` if using zsh or `.bash_profile` if not).
2. Create a `.env.development` file in the root of the project. The contents of the .env file is in 1Password. Ask permission to access it (the vault name is Mobile team). Once access is given copy and paste the contents from the 1Password Secure Note into your local .env file.
3. Download `keystore.properties` from 1Password and place it in the `android` folder

**IMPORTANT:** the `.env` files are never to be committed to the repo, and are already added to .gitignore.


### 3. Install the dependencies.

```zsh
yarn setup
```

### 4. Launch the app

#### For iOS

First install iOS dependencies:
```zsh
yarn podInstall
```

Now you can run the app

```zsh
# launch iOS simulator and start the app
yarn ios
```

**Note:** if you run into `"Your session has expired. Please log in."` issue, go to `XCode > Preferences > Accounts` and sign in with your account.

#### For Android
```zsh
# launch android emulator and start the app
yarn android
```

## Tests

You can run the test suite with

```zsh
yarn test
```

## Custom fonts

To add custom font, add it to src/assets folder and then run: 
```zsh
yarn link
```

## Navigation System

https://whimsical.com/mobile-navigation-system-4WaXLt2DgAutCmbfFF6wpS

## Wallet Connect Flows

https://whimsical.com/wallet-connect-flows-9QqTTDNdktBePx6vDR9oeX

## App Signing
[Documentation](docs/app_signing.md)

## Release Process
[Documentation](docs/release_process.md)

## Known issues
### Apple M1 chips

Exclude arch `arm64`

Prefix all comands with `arch -x86_64`

Examples:
```zsh
arch -x86_64 pod install
```

```zsh
arch -x86_64 yarn ios
```

### `pod install` fails on Apple M1 chips

Install ffi
```zsh
sudo arch -x86_64 gem install ffi
```
