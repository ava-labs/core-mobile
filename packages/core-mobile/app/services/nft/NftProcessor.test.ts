import NftProcessor from './NftProcessor'
import { NftContentType } from './types'

const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
const MP4_MAGIC = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70
])

const mockFetchResponse = (body: Uint8Array, ok = true): Response =>
  new Response(body.buffer as ArrayBuffer, { status: ok ? 206 : 504 })

describe('NftProcessor.fetchImage', () => {
  const fetchSpy = jest.spyOn(global, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  it('rejects when called with an empty uri', async () => {
    await expect(NftProcessor.fetchImage('')).rejects.toThrow(
      /fetchImage called with empty uri/
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns SVG directly for base64-encoded inline svg without hitting the network', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    const base64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
      'base64'
    )}`

    const result = await NftProcessor.fetchImage(base64)

    expect(result.type).toBe(NftContentType.SVG)
    expect(result.uri).toBe(base64)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('identifies content type via magic number on successful fetch', async () => {
    fetchSpy.mockResolvedValueOnce(mockFetchResponse(JPEG_MAGIC))

    const result = await NftProcessor.fetchImage(
      'https://example.com/image.bin'
    )

    expect(result.type).toBe(NftContentType.JPG)
    expect(result.uri).toBe('https://example.com/image.bin')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('identifies MP4 via magic number', async () => {
    fetchSpy.mockResolvedValueOnce(mockFetchResponse(MP4_MAGIC))

    const result = await NftProcessor.fetchImage(
      'https://example.com/video.bin'
    )

    expect(result.type).toBe(NftContentType.MP4)
  })

  it('rejects when the media URL returns a non-OK response', async () => {
    fetchSpy.mockResolvedValueOnce(
      mockFetchResponse(new Uint8Array(), /* ok */ false)
    )

    await expect(
      NftProcessor.fetchImage('https://example.com/broken')
    ).rejects.toThrow(/HTTP 504/)
  })

  it('propagates network errors from fetch', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'))

    await expect(
      NftProcessor.fetchImage('https://example.com/broken')
    ).rejects.toThrow('network down')
  })
})
