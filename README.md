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
| [@avalabs/core-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/core-mobile)           | Core Mobile app                     |
| [@avalabs/k2-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/k2-mobile)               | Mobile Design System (under 🚧👷‍♂️🚧) |
| [eslint-plugin-avalabs-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/eslint-mobile) | Shared Eslint plugin                |
| [@avalabs/tsconfig-mobile](https://github.com/ava-labs/avalanche-wallet-apps/tree/develop/packages/tsconfig-mobile)   | Shared Typescript config            |

## ⚡ Quickstart

1. Clone the repo
2. Install yarn globally (if you don't have yarn yet)
   ```
   brew install yarn
   ```
3. Set up `$NPM_TOKEN`

   To install all dependencies, you will need to generate an `NPM token` from your NPM.js account and add that as an environment variable named `NPM_TOKEN` on your machine (for example, `.zshenv` if using zsh or `.bash_profile` if not).

4. Install dependencies for all packages

   In the root directory, run:

   ```
   yarn install && yarn setup
   ```

5. Follow the specific instructions in each package to build/run it

## 📖 Tips

1. You can use these shortcuts to quickly run a command for `packages/core-mobile` and `packages/k2-mobile`

   ```
   yarn core <COMMAND>
   yarn k2 <COMMAND>

   e.g yarn core start && yarn core ios
   ```

2. To quickly remove all the node_modules folders, you can run
   ```
   ./scripts/remove-node-modules.sh
   ```
