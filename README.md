# Avalanche Wallet Apps

## Getting Started

First, clone the repo.

```zsh
git clone git@github.com:ava-labs/avalanche-wallet-apps.git
cd avalanche-wallet-apps/
```

Next, install the dependencies.

```zsh
yarn install
```

## Setup dev environment

Follow [these](https://reactnative.dev/docs/environment-setup) steps to setup dev environment; make sure to select 
**React Native CLI Quickstart** tab and select appropriate Development & Target OS.

## Launch iOS App

First install iOS dependencies.

```zsh
# install cocoapods
sudo gem install cocoapods
```

Now you can run the app

```zsh
# launch iOS simulator and start the app
yarn ios
```

## Launch Android App

Follow the steps in the React Native docs for [configuring your Android dev environment](https://reactnative.dev/docs/environment-setup).

```zsh
# launch android emulator and start the app
yarn android
```

## Tests

You can run the test suite with

```zsh
yarn test
```

## iOS & Android versioning

To update version of apps set new version in package.json and run
```zsh
yarn postversion
```
This will set versionName (bundle version string) to one set in package.json and increment versionCode (bundle version)
by one. 
