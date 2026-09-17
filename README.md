<!-- Title -->
<h1 align="center">
Ava Labs Mobile
</h1>

<p align="center">Welcome to the Mobile Team Repo</p>

---

## 📦 Packages

This repository is a monorepo that we manage using [Yarn workspaces](https://yarnpkg.com/features/workspaces).

| Package                                                                                                    | Description              |
| :--------------------------------------------------------------------------------------------------------- | :----------------------- |
| [@avalabs/core-mobile](https://github.com/ava-labs/core-mobile/tree/main/packages/core-mobile)             | Core Mobile app          |
| [@avalabs/k2-alpine](https://github.com/ava-labs/core-mobile/tree/main/packages/k2-alpine)                 | Mobile Design System     |
| [eslint-plugin-avalabs-mobile](https://github.com/ava-labs/core-mobile/tree/main/packages/eslint-mobile)   | Shared ESLint plugin     |
| [@avalabs/tsconfig-mobile](https://github.com/ava-labs/core-mobile/tree/main/packages/tsconfig-mobile)     | Shared TypeScript config |

## ✅ Requirements

- **Node.js >= 20.18** — install via [volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm)
- **Yarn** — the repo pins Yarn 3.6.4 in `.yarn/releases` (via `yarnPath`), so any modern Yarn launcher delegates to it:

  ```
  corepack enable
  ```

  or, if you prefer Homebrew: `brew install yarn` (Yarn >= 1.22 forwards to the pinned version automatically).

Everything else (Xcode, Android Studio, Ruby, AWS CLI, …) is only needed to build the app itself — see the [core-mobile README](packages/core-mobile/README.md#prerequisites).

## ⚡ Quickstart

1. Clone the repo

   ```
   git clone git@github.com:ava-labs/core-mobile.git && cd core-mobile
   ```

2. Install dependencies for all packages and run their setup scripts

   In the root directory, run:

   ```
   yarn install && yarn setup
   ```

3. Follow the specific instructions in each package to build/run it:
   - [core-mobile](packages/core-mobile/README.md) — the wallet app
   - [k2-alpine](packages/k2-alpine/README.md) — the design system / Storybook

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
