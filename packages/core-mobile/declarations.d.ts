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

declare module '*.html' {
  // Metro registers `.html` as an asset (see metro.config.js). The default
  // export is the asset module ID used by `Asset.fromModule(require(...))`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any
  export default value
}
