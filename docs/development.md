# Development

## Prerequisites

| Tool                    | Version                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Node.js                 | 20.18 or newer. Install with [Volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm).                        |
| Yarn                    | 3.6.4, pinned in `.yarn/releases`. Run `corepack enable`, or `brew install yarn`, which forwards to the pinned version. |
| Xcode                   | iOS builds.                                                                                                              |
| Ruby 3.3                | Bundler and CocoaPods 1.16.2.                                                                                            |
| JDK 17, Android Studio  | Android builds.                                                                                                          |
| AWS CLI v2              | With an SSO profile named `sso`.                                                                                         |

Xcode, Android Studio, Ruby and the AWS CLI are needed only to build the app. See the [core-mobile README](https://github.com/ava-labs/core-mobile/blob/main/packages/core-mobile/README.md) for more.

## Setup

1. Clone the repository and install dependencies from the root:

   ```bash
   git clone git@github.com:ava-labs/core-mobile.git && cd core-mobile
   yarn install && yarn setup
   ```

2. Pull the environment files:

   ```bash
   yarn core envs
   ```

   This pulls the `.env*` files and the Google services files from AWS Secrets Manager, then copies `.env.development` to `.env`. The real `.env*` files are gitignored. `.env.example` lists the variable names.

3. Install the iOS pods:

   ```bash
   yarn core podInstall
   ```

`yarn install` also runs codegen for the four OpenAPI clients. It fetches the specs over the network. With `APP_ENV=ci` it uses the production hosts. Other values use the test and dev hosts. The generated output in `app/utils/api/generated` is gitignored.

Root shortcuts run commands in a workspace: `yarn core <command>` for `packages/core-mobile` and `yarn k2 <command>` for `packages/k2-alpine`. To delete every `node_modules` folder, run `./scripts/remove-node-modules.sh`.

## Run

| Command                   | What it does                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `yarn core start`         | Start Metro with `expo start --dev-client`.                      |
| `yarn core ios`           | Run the iOS app, scheme `AvaxWalletInternal`.                    |
| `yarn core android`       | Run the Android app, variant `internalDebug`.                    |

Package READMEs: [core-mobile](https://github.com/ava-labs/core-mobile/blob/main/packages/core-mobile/README.md) and [k2-alpine](https://github.com/ava-labs/core-mobile/blob/main/packages/k2-alpine/README.md).

## Checks

| Command                    | What it does                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| `yarn core test`           | Jest tests. CI runs `yarn core test:coverage`.                               |
| `yarn core tsc`            | Type check.                                                                  |
| `yarn core lint`           | Lint.                                                                        |

Coverage thresholds are in `packages/core-mobile/coverage-thresholds.json`. Husky and lint-staged run on commit.

For the design system, run `yarn k2 storybook-generate`, then `yarn k2 start`.

## End-to-end tests

The E2E suite uses Appium 3 and WebdriverIO 9 in `packages/core-mobile/e2e`. It reports to TestRail and runs on AWS Device Farm. It needs a funded `E2E_MNEMONIC`. E2E runs only on Bitrise, not in GitHub Actions.

- `yarn core appium`, `yarn core appium:ios`, `yarn core appium:android`
- `yarn core appium:smoke*` for the smoke variants

Full details: [E2E README](https://github.com/ava-labs/core-mobile/blob/main/packages/core-mobile/e2e/README.md).
