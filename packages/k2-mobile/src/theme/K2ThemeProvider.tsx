import React, { PropsWithChildren } from 'react'
import { DripsyProvider } from 'dripsy'
import { theme } from './theme'

export const K2ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return <DripsyProvider theme={theme}>{children}</DripsyProvider>
}
