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
**React Native CLI Quickstart** tab and select appropriate Develeopment & Target OS.

## Launch iOS App

First install iOS dependencies.

```zsh
# install cocoapods
sudo gem install cocoapods

cd ios/
pod install
cd ..
```

Now you can run the app

```zsh
# launch iOS emulator
npx react-native run-ios

# start app
yarn ios
```

## Launch Android App

```zsh
# launch android emulator
npx react-native run-android

# start app
yarn android
```

## Tests

You can run the test suite with

```zsh
yarn test
```
