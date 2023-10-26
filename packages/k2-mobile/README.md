<h1 align="center">
@avalabs/k2-mobile
</h1>

<p align="center">Ava Labs K2 Mobile</p>

---

## Features

- Drop-in replacement to React Native primitives
- Theme-aware styling with the `sx` prop
- Responsive styles
- Customizable themes
- Full TypeScript support with IntelliSense
- Powered by [Dripsy](https://www.dripsy.xyz/)

## Integration

1. In your project's `tsconfig.json`, reference the `theme.d.ts` file. This is required for IntelliSense.

   ```json
   {
     "include": ["../k2-mobile/src/theme.d.ts"]
   }
   ```

2. Wrap your app with `K2ThemeProvider`

    ```jsx
    import { K2ThemeProvider } from '@avalabs/k2-mobile';

    const App = () => {
        return (
            <K2ThemeProvider>
            <!-- Your app content -->
            </K2ThemeProvider>
        );
    }
    ```

## Usage

1. Import React Native primitives from `'@avalabs/k2-mobile'`
2. Use the components as you would normally
3. Use the sx prop for styling 

    ```jsx
    import { View, Text } from '@avalabs/k2-mobile';

    <View
        sx={{
            height: [100, 400], // responsive values
            backgroundColor: '$primary' // equivalent to theme.colors.$primary
        }}
    >
        <Text
            // sx prop also supports function syntax, which allows access to the theme object directly
            sx={(theme) => ({
                color: theme.colors.$secondary
            })}
        />
    </View>
    ```

    Note: If you need to access the theme object outside the `sx` prop, you can use `useTheme()` hook.