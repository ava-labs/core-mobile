export const getLogoIconUrl = (icons: string[]): string | undefined => {
  return icons.find(icon => icon.endsWith('.png') || icon.endsWith('.ico'))
}
