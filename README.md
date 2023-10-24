<!-- Title -->
<h1 align="center">
Ava Labs Mobile
</h1>

<p align="center">Welcome to the Mobile Team Repo</p>

---

## 📦 Packages

This repository is a monorepo that we manage using [Yarn workspaces](https://yarnpkg.com/features/workspaces).

| Package             |                                         Description |
| :---                |                                            :---     |
| [@avalabs/core-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/core-mobile)        | Core Mobile app                                               |
| [@avalabs/k2-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/k2-mobile) | Mobile Design System (under 🚧👷‍♂️🚧)   | 
| [@avalabs/eslint-config-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/eslint-mobile) | Shared Eslint config        | 
| [@avalabs/tsconfig-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/tsconfig-mobile) | Shared Typescript config       | 

## ⚡ Quickstart

1. Clone the repo
2. Install yarn globally (if you don't have yarn yet)
   ```
   brew install yarn
   ```
4. Install required dependencies for all packages

   In the root directory, run:
   ```
   yarn install && yarn setup
   ```
5. Follow the specific instructions in each package to build/run it

## 📖 Tips

To quickly remove all the node_modules folders, you can run
```
./scripts/remove-node-modules.sh
```