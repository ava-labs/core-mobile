import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { darkTheme, type K2AlpineTheme } from './theme'

export const K2AlpineThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <DripsyProvider theme={darkTheme as K2AlpineTheme}>{children}</DripsyProvider>
)
