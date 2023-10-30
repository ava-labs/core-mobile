import { formatUriImageToPng } from './Contentful'

describe('formatUriImageToPng function', () => {
  it('Uri is a png image should return same uri that is passed in', () => {
    const result = formatUriImageToPng(
      'https://images.ctfassets.net/logo.png',
      18
    )
    expect(result).toBe('https://images.ctfassets.net/logo.png')
  })

  it('Uri is a svg image should return updated url that has png and resize params in uri', () => {
    const result = formatUriImageToPng(
      'https://images.ctfassets.net/logo.svg',
      25,
      1
    )
    expect(result).toBe(
      'https://images.ctfassets.net/logo.svg?fm=png&w=25&h=25'
    )
  })

  it('Uri is a svg image with pixel ratio should return updated url that has png and resize params with the pixel ratio in uri', () => {
    const result = formatUriImageToPng(
      'https://images.ctfassets.net/logo.svg',
      25,
      2
    )
    expect(result).toBe(
      'https://images.ctfassets.net/logo.svg?fm=png&w=50&h=50'
    )
  })
})
