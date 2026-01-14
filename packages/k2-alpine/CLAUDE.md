# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@avalabs/k2-alpine` is the mobile design system library for Ava Labs applications, built with React Native and Expo. It provides a comprehensive set of UI components, theming system, and utilities used primarily by the Core Mobile wallet application.

This package is part of a Yarn workspaces monorepo and runs as a standalone Storybook application for component development and documentation.

## Common Commands

### Development

```bash
# Start Expo development server with Storybook
yarn start

# Start on specific platform
yarn ios
yarn android

# Regenerate Storybook story list after adding/removing stories
yarn storybook-generate
```

### Testing & Quality

```bash
# Run all tests
yarn test

# Run type checking
yarn tsc

# Run linter
yarn lint
```

### Setup

```bash
# Install dependencies and run setup
yarn setup

# Apply patches (runs automatically after install)
yarn postinstall
```

## Architecture

### Styling System: Dripsy

The design system is built on **Dripsy**, a theme-UI based styling system for React Native that provides:
- Type-safe theme values via the `sx` prop
- Responsive design utilities
- Theme-aware styled components

**Key pattern**: Components use Dripsy's `styled()` function and `sx` prop for styling, accessing theme values via `$` prefix:

```typescript
<View sx={{ backgroundColor: '$surfacePrimary', padding: '$4' }} />
```

### Theme Architecture

Located in `src/theme/`:
- **`theme.ts`**: Core theme definition using Dripsy's `makeTheme()`
- **`ThemeProvider.tsx`**: Provider component wrapping app with light/dark theme
- **`tokens/`**: Design tokens (colors, text variants, icons, logos)

**Theme structure**:
- `colors`: Color palette with light/dark mode variants (`lightModeColors`, `darkModeColors`)
- `text`: Typography variants (body1, body2, heading1-6, buttonLarge, etc.)
- `isDark`: Boolean flag for current theme mode

**Theme usage in components**:
```typescript
import { useTheme } from '../../hooks'

const { theme } = useTheme()
const color = theme.colors.$textPrimary
```

**Inverse theme**: Use `useInversedTheme()` hook when a component needs opposite theme (e.g., dark UI on light mode).

### Component Architecture

Components are located in `src/components/` with the pattern:
```
ComponentName/
  ComponentName.tsx        # Main component
  ComponentName.stories.tsx # Storybook stories
  types.ts                 # Type definitions (if complex)
```

**Primitive components** (`src/components/Primitives.ts`):
- Styled wrappers around React Native core components
- `Text`, `View`, `ScrollView`, `FlatList`, `SafeAreaView`, `TouchableOpacity`, `TouchableHighlight`
- These primitives are theme-aware and should be used instead of React Native's defaults
- Default text variant is `body1` with color `$textPrimary`
- Font scaling is disabled (`allowFontScaling: false`) for consistency

**Component patterns**:
1. **Themed components**: Use `useTheme()` hook and access theme values
2. **Forward refs**: Input/interactive components use `forwardRef` for ref access
3. **Type safety**: Props are strongly typed with exported interfaces
4. **Storybook stories**: Every UI component has corresponding `.stories.tsx` file

### Key Component Categories

- **Primitives**: `View`, `Text`, `ScrollView`, `FlatList`, `SafeAreaView`, `TouchableOpacity`
- **Buttons**: `Button`, `CircularButton`, `SquareButton` with size/type variants
- **Inputs**: `TextInput`, `TokenAmountInput`, `TokenUnitInput`, `FiatAmountInput`, `PinInput`, `SearchBar`
- **Headers**: `BalanceHeader`, `NavigationTitleHeader`, `BalanceHeaderLoader`, `PrivacyModeAlert`
- **Display**: `Avatar`, `Card`, `Chip`, `Alert`, `Tooltip`, `Video`
- **Charts**: `MiniChart`, `StakingRewardChart`
- **Progress**: `CircularProgress`, `ProgressBar`, `MaskedProgressBar`
- **Controls**: `Toggle`, `SegmentedControl`, `Slider`, `DateTimePicker`
- **Staking**: `AddCard`, `ClaimCard`, `ProgressCard`, `CompleteCard` (specialized staking UI)
- **Animated**: `AnimatedText`, `AnimatedPressable`, `AnimatedBalance`, `Pinchable`
- **Layout**: `GlassView`, `Separator`, `GroupList`, `PageControl`
- **Toasts**: `Snackbar`, `TransactionSnackbar`, `NotificationAlert`

### Hooks

Located in `src/hooks/`:
- **`useTheme`**: Access current theme (re-exported from Dripsy's `useDripsyTheme`)
- **`useInversedTheme`**: Get opposite theme for inverse UI scenarios
- **`useMotion`**: Reanimated-based motion utilities
- **`usePressableGesture`**: Gesture handler for pressable components
- **`usePreventParentPress`**: Prevent touch propagation to parent

### Icons and Assets

**Icons** (`src/theme/tokens/Icons.ts`):
- Exported as `Icons` object with icon components as properties
- Used throughout components: `<Icons.CheckIcon />` or `Icons.CheckIcon` passed as prop
- SVG-based icons rendered via `react-native-svg`

**Logos** (`src/theme/tokens/Logos.ts`):
- Similar pattern to Icons for brand/chain logos
- Exported as `Logos` object

**Fonts** (`src/assets/fonts/`):
- Aeonik (Bold, Medium)
- Inter (Regular, SemiBold)
- DejaVuSansMono
- Loaded via `expo-font` in `App.tsx`

### Utilities

Located in `src/utils/`:
- **`colors.ts`**: Color manipulation utilities, button color getters
- **`tokenUnitInput.ts`**: Token amount parsing/formatting logic
- **`chart.ts`**: Chart data processing utilities
- **`animations.ts`**: Reanimated animation helpers
- **`screens.ts`**: Screen dimension utilities
- **`Link.tsx`**: Linking component wrapper

## Storybook Integration

The package runs **Storybook for React Native** to showcase components:

**Configuration**: `.storybook/main.ts`
- Stories pattern: `../src/**/*.stories.@(js|jsx|ts|tsx)`
- Addons: controls, actions, backgrounds

**App entry** (`App.tsx`):
- Loads fonts via `expo-font`
- Wraps Storybook UI with `K2AlpineThemeProvider`
- Respects system color scheme

**Story structure**: Each component has a `.stories.tsx` file demonstrating usage, variants, and props.

**Regenerating stories**: After adding/removing story files, run `yarn storybook-generate` to update `.storybook/storybook.requires.js`.

## Special Configurations

### SVG Support

Metro config (`metro.config.js`) uses `react-native-svg-transformer`:
- SVG files are imported as React components
- SVG removed from `assetExts`, added to `sourceExts`

### Patch Files

Located in `patches/`:
- `@expo+config+8.5.6.patch`: Expo config patches
- `react-native-reanimated+3.17.5.patch`: Reanimated patches

Applied automatically via `patch-package` in postinstall.

### TypeScript Configuration

- Extends `@avalabs/tsconfig-mobile/base.json`
- Path alias for `@avalabs/core-utils-sdk` points to sibling package
- Includes Storybook and config files in compilation

## Dependencies

**Key libraries**:
- **Dripsy (4.3.7)**: Theme-based styling system
- **React Native Reanimated (3.18.0)**: High-performance animations
- **React Native Gesture Handler (2.24.0)**: Touch gesture system
- **Expo packages**: blur, linear-gradient, video, fonts, splash-screen
- **@shopify/react-native-skia**: Canvas/graphics rendering
- **d3 (7.9.0)**: Chart data processing
- **big.js / bn.js**: Arbitrary-precision number handling

## Development Patterns

### Adding a New Component

1. Create component directory: `src/components/NewComponent/`
2. Create component file: `NewComponent.tsx` using Primitives and theme hooks
3. Export from `src/components/index.ts`
4. Create Storybook story: `NewComponent.stories.tsx`
5. Run `yarn storybook-generate` to register story
6. Test in Storybook: `yarn start`

### Component Implementation Guidelines

- Use **Primitives** (`View`, `Text`) instead of React Native components
- Access theme via `useTheme()` hook
- Use `sx` prop for styling with theme tokens (`$colorName`)
- Forward refs for interactive components
- Type all props with exported interfaces
- Disable font scaling for Text components (handled by Primitive)

### Adding Theme Tokens

**Colors** (`src/theme/tokens/colors.ts`):
- Define in both `lightModeColors` and `darkModeColors`
- Reference with `$` prefix in `sx` prop

**Text variants** (`src/theme/tokens/text.ts`):
- Add to `text` object with fontSize, lineHeight, fontFamily

## Testing

**Jest configuration** (`jest.config.js`):
- Preset: `react-native`
- Transform ignore pattern for ESM dependencies
- Tests co-located with components: `*.test.ts(x)`

**Running tests**:
```bash
# All tests
yarn test

# Single test file
yarn test <filename>
```

## Integration with Core Mobile

This package is consumed by `@avalabs/core-mobile` via `workspace:*` dependency:
- Changes here are immediately reflected in core-mobile during development
- No rebuild needed unless native dependencies change
- Shared TypeScript configuration via `@avalabs/tsconfig-mobile`
- Shared ESLint configuration via `eslint-plugin-avalabs-mobile`

## Notes

- **Font scaling**: Disabled globally for consistency across devices
- **Theme switching**: Handled by `K2AlpineThemeProvider` based on system color scheme
- **Expo SDK**: Version 53.0.20 (ensure compatibility with core-mobile)
- **Private package**: Not published to npm, internal workspace use only
