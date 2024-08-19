import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { theme } from './theme'

export const K2AlpineThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <DripsyProvider theme={theme}>{children}</DripsyProvider>
)
