<!-- Title -->
<h1 align="center">
Ava Labs Mobile
</h1>

<p align="center">Welcome to the Mobile Team Repo</p>

---

## 📦 Packages

This repository is a monorepo that we manage using [Yarn workspaces](https://yarnpkg.com/features/workspaces).

| Package                                                                                                               | Description                         |
| :-------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| [@avalabs/core-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/main/packages/core-mobile)           | Core Mobile app                     |
| [@avalabs/k2-alpine](https://github.com/ava-labs/avalanche-wallet-apps/tree/main/packages/k2-alpine)               | Mobile Design System                |
| [eslint-plugin-avalabs-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/main/packages/eslint-mobile) | Shared Eslint plugin                |
| [@avalabs/tsconfig-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/main/packages/tsconfig-mobile)   | Shared Typescript config            |

## ⚡ Quickstart

1. Clone the repo
2. Install yarn globally (if you don't have yarn yet)

   ```
   brew install yarn
   ```

3. Install dependencies for all packages

   In the root directory, run:

   ```
   yarn install && yarn setup
   ```

4. Follow the specific instructions in each package to build/run it

## 📖 Tips

1. You can use these shortcuts to quickly run a command for `packages/core-mobile` and `packages/k2-alpine`

   ```
   yarn core <COMMAND>
   yarn k2 <COMMAND>

   e.g yarn core start && yarn core ios
   ```

2. To quickly remove all the node_modules folders, you can run
   ```
   ./scripts/remove-node-modules.sh
   ```

   //YubiKey1
   //YubiKey2
