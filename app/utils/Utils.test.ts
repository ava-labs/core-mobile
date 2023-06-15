import { formatUriImageToPng } from './Utils'

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
      25
    )
    expect(result).toBe(
      'https://images.ctfassets.net/logo.svg?fm=png&w=25&h=25'
    )
  })
})
