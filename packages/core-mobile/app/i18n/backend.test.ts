import { RequireBackend } from './backend'

describe('RequireBackend', () => {
  it('reads a supported locale via callback', () => {
    const cb = jest.fn()
    RequireBackend.read?.('es-ES', 'translation', cb)
    expect(cb).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ Settings: 'Ajustes' })
    )
  })

  it('errors (not throws) on an unsupported locale', () => {
    const cb = jest.fn()
    RequireBackend.read?.('xx-XX', 'translation', cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false)
  })
})
