import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { darkTheme } from './theme'

export const K2AlpineThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <DripsyProvider theme={darkTheme}>{children}</DripsyProvider>
)
