import { readFileSync } from 'fs'
import { join } from 'path'

// The shim is a JS string injected into every page. Its origin fields must come
// from the `_docOrigin` snapshot taken at injection time, never from
// window.location at send time (which a page can shadow). (CP-15105 R2-15)
const src = readFileSync(join(__dirname, 'evmProviderShim.ts'), 'utf8')

describe('evmProviderShim origin pinning', () => {
  it('captures the origin once at injection', () => {
    expect(src).toMatch(/var _docOrigin = window\.location\.origin;/)
  })

  it('uses only _docOrigin for every origin field it sends', () => {
    const originAssignments = src.match(/origin:\s*[A-Za-z_.]+/g) ?? []
    expect(originAssignments.length).toBeGreaterThan(0)
    for (const a of originAssignments) {
      expect(a).toBe('origin: _docOrigin')
    }
  })
})
