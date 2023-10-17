declare module 'rn-dominant-color' {
  export function getColorFromURL(imageUrl: string): Promise<{
    primary: string
    secondary: string
    background: string
    detail: string
  }>
}
