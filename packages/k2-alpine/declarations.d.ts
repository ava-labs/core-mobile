import React from 'react'

declare module '*.svg' {
  import React from 'react'
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  export default content
}

// Global type alias for React 19 compatibility
// This allows continued use of JSX.Element while mapping to React.JSX.Element
declare global {
  namespace JSX {
    type Element = React.JSX.Element
  }
}
