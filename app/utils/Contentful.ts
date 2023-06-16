export const formatUriImageToPng = (uri: string, size: number) => {
  const allowedUrl = 'https://images.ctfassets.net'
  if (uri.startsWith(allowedUrl)) {
    return uri?.endsWith('.svg') ? `${uri}?fm=png&w=${size}&h=${size}` : uri
  }
  return uri
}
