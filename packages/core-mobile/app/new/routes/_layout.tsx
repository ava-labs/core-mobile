import React from 'react'
import { ColorSchemeProvider } from 'common/contexts/ColorSchemeProvider'
import Root from './root'

export default function RootLayout(): JSX.Element | null {
  return (
    <ColorSchemeProvider>
      <Root />
    </ColorSchemeProvider>
  )
}
