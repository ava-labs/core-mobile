// Mock the catalog registry so we can exercise a *throwing* thunk for a
// supported locale (the backend guards unsupported codes before calling the
// thunk, so the throw branch needs a supported code). Real-catalog content is
// asserted in locales.test.ts.
jest.mock('./locales', () => ({
  LOCALES: {
    'es-ES': () => ({ Settings: 'Ajustes' }),
    'de-DE': () => {
      throw new Error('corrupt bundled catalog')
    }
  }
}))

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

  it('errors (not throws) when a supported locale thunk throws', () => {
    const cb = jest.fn()
    RequireBackend.read?.('de-DE', 'translation', cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false)
  })
})
