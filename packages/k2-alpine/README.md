# K2 Alpine

Mobile design system for the Ava Labs mobile team. Components are developed and showcased in [Storybook for React Native](https://github.com/storybookjs/react-native), running inside an Expo app.

`@avalabs/core-mobile` consumes this package through the `workspace:*` protocol, so component changes are picked up by the app immediately — no rebuild or reinstall needed (unless native dependencies change).

## Run Storybook

From the repo root (after `yarn install && yarn setup`):

```zsh
yarn k2 start
```

This starts Expo; press `i` to open the iOS simulator or `a` for the Android emulator. The app boots straight into Storybook.

## Adding stories

Stories live next to the components as `*.stories.tsx`. After adding or renaming stories, regenerate the story index:

```zsh
yarn k2 storybook-generate
```

## Common commands

```zsh
# run unit tests
yarn k2 test

# run typescript check
yarn k2 tsc

# run lint check
yarn k2 lint
```

(Or run `yarn test` / `yarn tsc` / `yarn lint` directly from this package's directory.)
