import React, { PropsWithChildren } from 'react'
import { DripsyProvider } from 'dripsy'
import { theme } from './theme'

export const K2ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // todo: please remove the ts-ignore comments after we address this issue
  // https://ava-labs.atlassian.net/browse/CP-9297
  // @ts-ignore
  return <DripsyProvider theme={theme}>{children}</DripsyProvider>
}
