import { buildEvmProviderShim } from './evmProviderShim'

describe('buildEvmProviderShim', () => {
  const defaultParams = {
    chainId: '0xa86a',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    uuid: 'test-uuid-1234'
  }

  it('returns a non-empty string', () => {
    const shim = buildEvmProviderShim(defaultParams)
    expect(typeof shim).toBe('string')
    expect(shim.length).toBeGreaterThan(0)
  })

  it('wraps the code in an IIFE', () => {
    const shim = buildEvmProviderShim(defaultParams)
    expect(shim.trimStart()).toMatch(/^\(function\(\)/)
    expect(shim.trimEnd()).toMatch(/\}\)\(\);$/)
  })

  describe('embedded values', () => {
    it('embeds the chain ID', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain("var _chainId = '0xa86a'")
    })

    it('embeds the address', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain(
        "var _address = '0x1234567890abcdef1234567890abcdef12345678'"
      )
    })

    it('embeds a different chain ID when provided', () => {
      const shim = buildEvmProviderShim({
        chainId: '0x1',
        address: defaultParams.address,
        uuid: defaultParams.uuid
      })
      expect(shim).toContain("var _chainId = '0x1'")
      expect(shim).not.toContain("var _chainId = '0xa86a'")
    })

    it('embeds an empty address when not provided', () => {
      const shim = buildEvmProviderShim({
        chainId: '0xa86a',
        address: '',
        uuid: defaultParams.uuid
      })
      expect(shim).toContain("var _address = ''")
    })
  })

  describe('pre-connected state', () => {
    it('always returns true from isConnected (EIP-1193: network connectivity, not account auth)', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain('_isConnected: true')
    })

    it('stays true even when address is empty', () => {
      const shim = buildEvmProviderShim({
        ...defaultParams,
        address: ''
      })
      expect(shim).toContain('_isConnected: true')
    })

    it('initializes _accounts from _address', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain('var _accounts = _address ? [_address] : []')
    })
  })

  describe('EIP-1193 provider object', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('sets isMetaMask flag to true for broad dApp compatibility', () => {
      expect(shim).toContain('isMetaMask: true')
    })

    it('sets isAvalanche flag (prevents wagmi MetaMask connector from claiming our provider)', () => {
      expect(shim).toContain('isAvalanche: true')
    })

    it('sets isCore flag on window.core namespace', () => {
      expect(shim).toContain('isCore: true')
    })

    it('implements request method', () => {
      expect(shim).toContain('request: function(args)')
    })

    it('implements isConnected method', () => {
      expect(shim).toContain('isConnected: function()')
    })

    it('provides _metamask.isUnlocked() for wagmi compatibility', () => {
      expect(shim).toContain('_metamask:')
      expect(shim).toContain('isUnlocked: function()')
    })
  })

  describe('local RPC methods handled in shim', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it.each([
      'eth_chainId',
      'eth_accounts',
      'net_version',
      'eth_coinbase',
      'eth_requestAccounts',
      'wallet_requestPermissions',
      'wallet_getPermissions',
      'wallet_revokePermissions'
    ])('handles %s locally', method => {
      expect(shim).toContain(`method === '${method}'`)
    })
  })

  describe('legacy method support', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('implements enable()', () => {
      expect(shim).toContain('enable: function()')
    })

    it('implements send()', () => {
      expect(shim).toContain('send: function(methodOrPayload')
    })

    it('implements sendAsync()', () => {
      expect(shim).toContain('sendAsync: function(payload, callback)')
    })
  })

  describe('event emitter', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('implements on()', () => {
      expect(shim).toContain('on: function(event, fn)')
    })

    it('implements addListener()', () => {
      expect(shim).toContain('addListener: function(event, fn)')
    })

    it('implements once()', () => {
      expect(shim).toContain('once: function(event, fn)')
    })

    it('implements removeListener()', () => {
      expect(shim).toContain('removeListener: function(event, fn)')
    })

    it('implements off()', () => {
      expect(shim).toContain('off: function(event, fn)')
    })

    it('implements removeAllListeners()', () => {
      expect(shim).toContain('removeAllListeners: function(event)')
    })

    it('implements listenerCount()', () => {
      expect(shim).toContain('listenerCount: function(event)')
    })

    it('implements listeners()', () => {
      expect(shim).toContain('listeners: function(event)')
    })
  })

  describe('global provider installation', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('installs window.ethereum via Object.defineProperty', () => {
      expect(shim).toContain("Object.defineProperty(window, 'ethereum'")
    })

    it('installs window.core via Object.defineProperty', () => {
      expect(shim).toContain("Object.defineProperty(window, 'core'")
    })

    it('installs window.avalanche via Object.defineProperty', () => {
      expect(shim).toContain("Object.defineProperty(window, 'avalanche'")
    })

    it('makes properties non-configurable', () => {
      expect(shim).toContain('configurable: false')
    })

    it('includes a no-op setter to prevent overrides', () => {
      expect(shim).toContain('set: function() {}')
    })
  })

  describe('EIP-6963 announcement', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('dispatches eip6963:announceProvider event', () => {
      expect(shim).toContain('eip6963:announceProvider')
    })

    it('listens for eip6963:requestProvider event', () => {
      expect(shim).toContain('eip6963:requestProvider')
    })

    it('uses rdns app.core.mobile', () => {
      expect(shim).toContain("rdns: 'app.core.mobile'")
    })

    it('sets provider name to Core Mobile', () => {
      expect(shim).toContain("name: 'Core Mobile'")
    })

    it('includes a base64 SVG icon', () => {
      expect(shim).toContain("icon: 'data:image/svg+xml;base64,")
    })

    it('freezes providerInfo per EIP-6963 spec', () => {
      expect(shim).toContain('var providerInfo = Object.freeze(')
    })

    it('freezes _providerDetail per EIP-6963 spec', () => {
      expect(shim).toContain('var _providerDetail = Object.freeze(')
    })

    it('re-announces on DOMContentLoaded and load events', () => {
      expect(shim).toContain(
        "document.addEventListener('DOMContentLoaded', announceProvider)"
      )
      expect(shim).toContain(
        "window.addEventListener('load', announceProvider)"
      )
    })

    it('uses staggered timeouts for late-initialising libraries', () => {
      expect(shim).toContain('setTimeout(announceProvider, 100)')
      expect(shim).toContain('setTimeout(announceProvider, 1000)')
      expect(shim).toContain('setTimeout(announceProvider, 3000)')
    })
  })

  describe('injection guards', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('includes doctypeCheck', () => {
      expect(shim).toContain('function doctypeCheck()')
    })

    it('includes suffixCheck for xml and pdf', () => {
      expect(shim).toContain('function suffixCheck()')
      expect(shim).toContain("'xml'")
      expect(shim).toContain("'pdf'")
    })

    it('includes documentElementCheck', () => {
      expect(shim).toContain('function documentElementCheck()')
    })

    it('early returns if guards fail', () => {
      expect(shim).toContain(
        'if (!doctypeCheck() || !suffixCheck() || !documentElementCheck()) return'
      )
    })
  })

  describe('native bridge', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('defines __coreProviderRespond on window', () => {
      expect(shim).toContain('window.__coreProviderRespond = function(id')
    })

    it('rejects with an Error instance so wagmi/viem instanceof checks pass (EIP-1193 compliance)', () => {
      // EIP-1193: "the Provider MUST reject with an Error object"
      // wagmi uses instanceof checks on errors; plain-object rejections
      // lose their .code and crash dApps like Aave when handling 4902.
      expect(shim).toContain('var e = new Error(error.message')
      expect(shim).toContain('e.code = error.code')
      expect(shim).toContain('cb.reject(e)')
    })

    it('defines __coreProviderEmit on window', () => {
      expect(shim).toContain('window.__coreProviderEmit = function(eventName')
    })

    it('uses safeSend wrapper for postMessage', () => {
      expect(shim).toContain('function safeSend(msg)')
      expect(shim).toContain('window.ReactNativeWebView')
    })

    it('sends domain_metadata message', () => {
      expect(shim).toContain("method: 'domain_metadata'")
    })

    it('sends provider_request messages', () => {
      expect(shim).toContain("method: 'provider_request'")
    })
  })

  describe('legacy event dispatch & initial connect', () => {
    it('dispatches ethereum#initialized event', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain("new Event('ethereum#initialized')")
    })

    it('emits EIP-1193 connect event once at initialisation', () => {
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).toContain("emit('connect', { chainId: _chainId })")
    })
  })

  describe('desktop user-agent override (deferred)', () => {
    let shim: string

    beforeAll(() => {
      shim = buildEvmProviderShim(defaultParams)
    })

    it('overrides navigator.userAgent via Object.defineProperty', () => {
      expect(shim).toContain("Object.defineProperty(navigator, 'userAgent'")
    })

    it('uses a desktop Chrome user-agent string', () => {
      expect(shim).toContain('Macintosh; Intel Mac OS X')
      expect(shim).toContain('Chrome/')
    })

    it('defers the override until after page load', () => {
      expect(shim).toContain("window.addEventListener('load'")
      expect(shim).toContain('_applyDesktopUA')
      expect(shim).toContain('_uaOverridden')
    })

    it('has a fallback timeout for pages that do not fire load', () => {
      expect(shim).toContain('setTimeout(_applyDesktopUA, 4000)')
    })
  })

  describe('event listener (no auto-fire)', () => {
    it('does NOT auto-fire connect/accountsChanged on listener attachment (prevents React #185 loop)', () => {
      // Auto-firing current state to new listeners causes wagmi to re-subscribe
      // during its cleanup/setup cycle, which feeds back into another auto-fire,
      // producing React error #185 (infinite update loop) when dApps trigger chain-switch UI.
      const shim = buildEvmProviderShim(defaultParams)
      expect(shim).not.toContain("event === 'connect'")
      expect(shim).not.toContain("event === 'accountsChanged'")
    })
  })

  describe('SPA navigation listener (security)', () => {
    it('does not emit nav_change messages from page JS', () => {
      const shim = buildEvmProviderShim({
        chainId: '0xa86a',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        uuid: 'test-uuid-1234'
      })
      // The page must not be able to drive the native origin via postMessage.
      expect(shim).not.toContain('nav_change')
    })

    it('does not patch history.pushState or history.replaceState', () => {
      const shim = buildEvmProviderShim({
        chainId: '0xa86a',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        uuid: 'test-uuid-1234'
      })
      expect(shim).not.toContain('history.pushState')
      expect(shim).not.toContain('history.replaceState')
    })
  })
})
