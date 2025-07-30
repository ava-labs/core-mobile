import React from 'react'

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  const testID: string
  export default content
}

declare module '*.png' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any
  export default value
}

// Global type alias for React 19 compatibility
// This allows continued use of JSX.Element while mapping to React.JSX.Element
declare global {
  namespace JSX {
    type Element = React.JSX.Element
  }
}
