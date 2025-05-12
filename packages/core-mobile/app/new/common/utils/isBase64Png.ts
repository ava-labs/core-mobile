export const isBase64Png = (imageData: string): boolean => {
  return imageData.startsWith('data:image/png;base64')
}
