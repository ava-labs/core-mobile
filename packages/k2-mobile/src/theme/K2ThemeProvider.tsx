import React from 'react'
import { DripsyProvider } from 'dripsy'
import { theme } from './theme'

export const K2ThemeProvider: React.FC = ({ children }) => {
  return <DripsyProvider theme={theme}>{children}</DripsyProvider>
}
