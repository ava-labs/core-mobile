// add intellisense to theme
import type { K2AlpineTheme } from './theme/theme'

declare module 'dripsy' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DripsyCustomTheme extends K2AlpineTheme {}
}
