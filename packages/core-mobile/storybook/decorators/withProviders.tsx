import React from 'react'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { K2ThemeProvider } from '@avalabs/k2-mobile'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withProviders = (Story: any): React.JSX.Element => (
  <ReactQueryProvider>
    <K2ThemeProvider>
      <Story />
    </K2ThemeProvider>
  </ReactQueryProvider>
)
