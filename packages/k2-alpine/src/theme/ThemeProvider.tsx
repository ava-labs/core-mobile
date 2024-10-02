// @ts-nocheck - we need to ignore this for now until https://ava-labs.atlassian.net/browse/CP-9297 is done
import React, { PropsWithChildren, type FC } from 'react'
import { DripsyProvider } from 'dripsy'
import { darkTheme } from './theme'

export const K2AlpineThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <DripsyProvider theme={darkTheme}>{children}</DripsyProvider>
)
