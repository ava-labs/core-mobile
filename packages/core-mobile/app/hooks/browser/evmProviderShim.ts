/**
 * EVM Provider Shim — injected into WebView to provide window.ethereum (EIP-1193).
 *
 * Communication protocol:
 *   JS → Native:  window.ReactNativeWebView.postMessage(JSON.stringify({
 *                    method: 'provider_request',
 *                    payload: JSON.stringify({ id, request: { method, params } })
 *                  }))
 *
 *   Native → JS:  webViewRef.injectJavaScript(
 *                    `window.__coreProviderRespond(id, error, result); true;`
 *                  )
 *
 * Events (native → JS):
 *   webViewRef.injectJavaScript(
 *     `window.__coreProviderEmit('chainChanged', '0xa86a'); true;`
 *   )
 */
export function buildEvmProviderShim({
  chainId,
  address
}: {
  chainId: string // hex, e.g. '0xa86a'
  address: string // e.g. '0x1234...'
}): string {
  return `(function() {
  'use strict';

  // ──────────────────────────────────────────────
  // 1. Injection guards (ported from Core extension)
  // ──────────────────────────────────────────────
  function doctypeCheck() {
    var dt = document.doctype;
    if (dt) return dt.name === 'html';
    return true;
  }
  function suffixCheck() {
    var dominated = ['xml', 'pdf'];
    var path = window.location.pathname;
    for (var i = 0; i < dominated.length; i++) {
      if (path.endsWith('.' + dominated[i])) return false;
    }
    return true;
  }
  function documentElementCheck() {
    var el = document.documentElement;
    return el ? el.nodeName.toLowerCase() === 'html' : true;
  }
  if (!doctypeCheck() || !suffixCheck() || !documentElementCheck()) return;

  // ──────────────────────────────────────────────
  // 2. State
  // ──────────────────────────────────────────────
  var _requestId = 0;
  var _callbacks = {};
  var _listeners = {};
  var _chainId = '${chainId}';
  var _address = '${address}';
  var _connected = !!_address;
  var _accounts = _address ? [_address] : [];

  // ──────────────────────────────────────────────
  // 3. Native response / event bridge
  // ──────────────────────────────────────────────
  window.__coreProviderRespond = function(id, error, result) {
    var cb = _callbacks[id];
    if (!cb) return;
    delete _callbacks[id];
    if (error) {
      cb.reject(typeof error === 'object' ? error : { code: -32603, message: String(error) });
    } else {
      cb.resolve(result);
    }
  };

  window.__coreProviderEmit = function(eventName, data) {
    if (eventName === 'chainChanged') {
      _chainId = data;
      provider.chainId = data;
      provider.networkVersion = String(parseInt(data, 16));
    }
    if (eventName === 'accountsChanged') {
      _accounts = data || [];
      provider.selectedAddress = _accounts.length > 0 ? _accounts[0] : null;
    }
    emit(eventName, data);
  };

  function emit(eventName, data) {
    var fns = _listeners[eventName];
    if (!fns) return;
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](data); } catch(e) { console.error('[CoreProvider] event handler error', e); }
    }
  }

  // ──────────────────────────────────────────────
  // 4. EIP-1193 provider
  // ──────────────────────────────────────────────
  var provider = {
    isMetaMask: true,
    isCore: true,
    isAvalanche: true,
    _isConnected: _connected,

    request: function(args) {
      if (!args || typeof args.method !== 'string') {
        return Promise.reject({ code: -32600, message: 'Invalid request' });
      }

      var method = args.method;
      var params = args.params || [];

      // Handle connection and read methods locally (no bridge round-trip)
      if (method === 'eth_chainId') {
        return Promise.resolve(_chainId);
      }
      if (method === 'eth_accounts') {
        return Promise.resolve(_accounts.slice());
      }
      if (method === 'net_version') {
        return Promise.resolve(String(parseInt(_chainId, 16)));
      }
      if (method === 'eth_coinbase') {
        return Promise.resolve(_address || null);
      }
      if (method === 'eth_requestAccounts') {
        if (!_address) return Promise.reject({ code: 4100, message: 'No account available' });
        _connected = true;
        provider._isConnected = true;
        _accounts = [_address];
        provider.selectedAddress = _address;
        setTimeout(function() {
          emit('connect', { chainId: _chainId });
          emit('accountsChanged', _accounts);
        }, 0);
        return Promise.resolve([_address]);
      }
      if (method === 'wallet_requestPermissions') {
        if (!_address) return Promise.reject({ code: 4100, message: 'No account available' });
        _connected = true;
        provider._isConnected = true;
        _accounts = [_address];
        provider.selectedAddress = _address;
        setTimeout(function() { emit('accountsChanged', _accounts); }, 0);
        return Promise.resolve([{
          parentCapability: 'eth_accounts',
          date: Date.now(),
          caveats: [{ type: 'restrictReturnedAccounts', value: [_address] }]
        }]);
      }
      if (method === 'wallet_getPermissions') {
        var perms = _address ? [{
          parentCapability: 'eth_accounts',
          date: Date.now(),
          caveats: [{ type: 'restrictReturnedAccounts', value: [_address] }]
        }] : [];
        return Promise.resolve(perms);
      }

      // Everything else goes to native
      var id = ++_requestId;
      return new Promise(function(resolve, reject) {
        _callbacks[id] = { resolve: resolve, reject: reject };

        var message = {
          method: 'provider_request',
          payload: JSON.stringify({
            id: id,
            request: { method: method, params: params }
          })
        };

        try {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } catch(e) {
          delete _callbacks[id];
          reject({ code: -32603, message: 'Bridge unavailable' });
        }
      });
    },

    // Legacy methods
    enable: function() {
      return provider.request({ method: 'eth_requestAccounts' });
    },
    send: function(methodOrPayload, paramsOrCallback) {
      if (typeof methodOrPayload === 'string') {
        return provider.request({ method: methodOrPayload, params: paramsOrCallback || [] });
      }
      if (typeof paramsOrCallback === 'function') {
        provider.request(methodOrPayload)
          .then(function(r) { paramsOrCallback(null, { id: methodOrPayload.id, jsonrpc: '2.0', result: r }); })
          .catch(function(e) { paramsOrCallback(e); });
        return;
      }
      return provider.request(methodOrPayload);
    },
    sendAsync: function(payload, callback) {
      provider.request({ method: payload.method, params: payload.params })
        .then(function(r) { callback(null, { id: payload.id, jsonrpc: '2.0', result: r }); })
        .catch(function(e) { callback(e); });
    },

    // Event emitter
    on: function(event, fn) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(fn);
      // Auto-fire for already-connected state so wagmi's connector
      // picks up the connection during setup() and triggers auto-connect
      if (_connected && _accounts.length > 0) {
        if (event === 'connect') {
          setTimeout(function() { try { fn({ chainId: _chainId }); } catch(e) {} }, 0);
        } else if (event === 'accountsChanged') {
          setTimeout(function() { try { fn(_accounts.slice()); } catch(e) {} }, 0);
        }
      }
      return provider;
    },
    removeListener: function(event, fn) {
      var fns = _listeners[event];
      if (!fns) return provider;
      _listeners[event] = fns.filter(function(f) { return f !== fn; });
      return provider;
    },
    removeAllListeners: function(event) {
      if (event) delete _listeners[event];
      else _listeners = {};
      return provider;
    },

    isConnected: function() {
      return _connected;
    },

    chainId: _chainId,
    networkVersion: String(parseInt(_chainId, 16)),
    selectedAddress: _address || null
  };

  // ──────────────────────────────────────────────
  // 5. Install provider globals (mimic Core browser extension)
  // ──────────────────────────────────────────────
  // window.ethereum — standard EIP-1193 provider
  Object.defineProperty(window, 'ethereum', {
    get: function() { return provider; },
    set: function() {},
    configurable: false
  });

  // window.core — RainbowKit/wagmi Core wallet connectors look for
  // window.core?.ethereum to get the provider
  var coreNamespace = { ethereum: provider, isCore: true };
  Object.defineProperty(window, 'core', {
    get: function() { return coreNamespace; },
    set: function() {},
    configurable: false
  });

  // window.avalanche — fallback used by some Core wallet connectors
  Object.defineProperty(window, 'avalanche', {
    get: function() { return provider; },
    set: function() {},
    configurable: false
  });

  // ──────────────────────────────────────────────
  // 6. EIP-6963 announcement
  // ──────────────────────────────────────────────
  var providerInfo = {
    uuid: 'core-mobile-' + Date.now(),
    name: 'Core',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTgiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNi4yOTIxIDI0Ljc0OTNDMjcuNjY4MiAyNC43NDkzIDI4LjkxNTUgMjUuMDQ3IDMwLjAzNDIgMjUuNjQxNkMzMS4xNTIxIDI2LjIzNjMgMzIuMDMzOSAyNy4wNzg1IDMyLjY3OTcgMjguMTY4MkMzMy4zMjQ3IDI5LjI1NzIgMzMuNjQ3NiAzMC41MTQ2IDMzLjY0NzYgMzEuOTM4OEMzMy42NDc2IDMzLjM2MzEgMzMuMzE2MSAzNC42MjA1IDMyLjY1MzcgMzUuNzA5NEMzMS45OTEzIDM2Ljc5ODQgMzEuMDk2OCAzNy42NDA2IDI5Ljk3MDMgMzguMjM2QzI4Ljg0MzcgMzguODMwNiAyNy41ODI5IDM5LjEyODMgMjYuMTg5NSAzOS4xMjgzQzI0Ljc5NjEgMzkuMTI4MyAyMy41NzQ3IDM4LjgzMDYgMjIuNDczNCAzOC4yMzZDMjEuMzcyMSAzNy42NDE0IDIwLjUwNzYgMzYuNzk5MiAxOS44OCAzNS43MDk0QzE5LjgwODkgMzUuNTg2NCAxOS43NDE4IDM1LjQ2MTEgMTkuNjc4NyAzNS4zMzM0QzE5LjYxMjQgMzUuNDYxMSAxOS41NDIxIDM1LjU4NjQgMTkuNDY3MSAzNS43MDk0QzE4LjgwNDcgMzYuNzk4NCAxNy45MTAzIDM3LjY0MDYgMTYuNzgyOSAzOC4yMzZDMTUuNjU2MyAzOC44MzA2IDE0LjM5NTUgMzkuMTI4MyAxMy4wMDIxIDM5LjEyODNDMTEuNjA4NyAzOS4xMjgzIDEwLjM4NzQgMzguODMwNiA5LjI4NjA1IDM4LjIzNkM4LjE4NDc0IDM3LjY0MTQgNy4zMjAyNiAzNi43OTkyIDYuNjkyNjMgMzUuNzA5NEM2LjA2NDIxIDM0LjYyMDUgNS43NSAzMy4zNjMxIDUuNzUgMzEuOTM4OEM1Ljc1IDMwLjUxNDYgNi4wNzI4OSAyOS4yNTcyIDYuNzE3ODkgMjguMTY4MkM3LjM2Mjg5IDI3LjA3OTIgOC4yNDQ3NCAyNi4yMzcxIDkuMzYzNDIgMjUuNjQxNkMxMC40ODEzIDI1LjA0NyAxMS43Mjg3IDI0Ljc0OTMgMTMuMTA0NyAyNC43NDkzQzE0LjQ4MDggMjQuNzQ5MyAxNS43MjgyIDI1LjA0NyAxNi44NDY4IDI1LjY0MTZDMTcuOTY0NyAyNi4yMzYzIDE4Ljg0NjYgMjcuMDc4NSAxOS40OTI0IDI4LjE2ODJDMTkuNTY1OCAyOC4yOTIgMTkuNjM0NSAyOC40MTczIDE5LjY5OTIgMjguNTQ1QzE5Ljc2MzIgMjguNDE3MyAxOS44MzE4IDI4LjI5MiAxOS45MDUzIDI4LjE2ODJDMjAuNTUwMyAyNy4wNzkyIDIxLjQzMjEgMjYuMjM3MSAyMi41NTA4IDI1LjY0MTZDMjMuNjY4NyAyNS4wNDcgMjQuOTE2MSAyNC43NDkzIDI2LjI5MjkgMjQuNzQ5M0gyNi4yOTIxWk0yNi4yOTIxIDI4LjE2ODJDMjUuNTY3NCAyOC4xNjgyIDI0LjkxMTMgMjguMzI0MSAyNC4zMjI0IDI4LjYzNTlDMjMuNzMzNCAyOC45NDc3IDIzLjI3IDI5LjM4OTYgMjIuOTMwNSAyOS45NjA3QzIyLjU5MTEgMzAuNTMxOCAyMi40MjEzIDMxLjE5MTQgMjIuNDIxMyAzMS45MzhDMjIuNDIxMyAzMi42ODQ2IDIyLjU4NjMgMzMuMzQ0MyAyMi45MTcxIDMzLjkxNTRDMjMuMjQ3OSAzNC40ODY1IDIzLjcwMjYgMzQuOTI4NCAyNC4yODIxIDM1LjI0MDJDMjQuODYxNiAzNS41NTIgMjUuNTEzNyAzNS43MDc5IDI2LjIzODQgMzUuNzA3OUMyNi45NjMyIDM1LjcwNzkgMjcuNjM1IDM1LjU1MiAyOC4yMjc5IDM1LjI0MDJDMjguODIwOCAzNC45Mjg0IDI5LjI5MjEgMzQuNDg2NSAyOS42NDAzIDMzLjkxNTRDMjkuOTg5MiAzMy4zNDQzIDMwLjE2MjkgMzIuNjg0NiAzMC4xNjI5IDMxLjkzOEMzMC4xNjI5IDMxLjE5MTQgMjkuOTkzMiAzMC41MzE4IDI5LjY1MzcgMjkuOTYwN0MyOS4zMTQyIDI5LjM4OTYgMjguODUgMjguOTQ3NyAyOC4yNjE4IDI4LjYzNTlDMjcuNjcyOSAyOC4zMjQxIDI3LjAxNjggMjguMTY4MiAyNi4yOTIxIDI4LjE2ODJaTTEzLjE2OTUgMjguMTY4MkMxMi40NDQ3IDI4LjE2ODIgMTEuNzg4NyAyOC4zMjQxIDExLjE5OTcgMjguNjM1OUMxMC42MTA4IDI4Ljk0NzcgMTAuMTQ3NCAyOS4zODk2IDkuODA3ODkgMjkuOTYwN0M5LjQ2ODQyIDMwLjUzMTggOS4yOTg2OCAzMS4xOTE0IDkuMjk4NjggMzEuOTM4QzkuMjk4NjggMzIuNjg0NiA5LjQ2MzY4IDMzLjM0NDMgOS43OTQ0NyAzMy45MTU0QzEwLjEyNTMgMzQuNDg2NSAxMC41OCAzNC45Mjg0IDExLjE1OTUgMzUuMjQwMkMxMS43Mzg5IDM1LjU1MiAxMi4zOTExIDM1LjcwNzkgMTMuMTE1IDM1LjcwNzlDMTMuODM4OSAzNS43MDc5IDE0LjUxMTYgMzUuNTUyIDE1LjEwNDUgMzUuMjQwMkMxNS42OTc0IDM0LjkyODQgMTYuMTY4NyAzNC40ODY1IDE2LjUxNjggMzMuOTE1NEgxOS4xNjM5QzE5LjAxMjQgMzMuMjk2NSAxOC45MzY2IDMyLjYzNzYgMTguOTM2NiAzMS45MzhDMTguOTM2NiAzMS4zMTgzIDE4Ljk5NzQgMzAuNzMwOCAxOS4xMTk3IDMwLjE3NDVIMTYuNTE2OEMxNi4yNjY2IDI5LjQ1NjkgMTUuNzI2NiAyOC45NDY5IDE1LjEzODQgMjguNjM1MUMxNC41NDk1IDI4LjMyMzMgMTMuODkzNCAyOC4xNjc0IDEzLjE2ODcgMjguMTY3NEwxMy4xNjk1IDI4LjE2ODJaTTUxLjIwNDcgMjQuNzQ5M0M1Mi41NjQyIDI0Ljc0OTMgNTMuNzgwOCAyNS4wMzQ1IDU0Ljg1NjEgMjUuNjA0QzU1LjkzMTMgMjYuMTczNiA1Ni43NjU4IDI2Ljk4MjEgNTcuMzU5NSAyOC4wMjk1QzU3Ljk1MzIgMjkuMDc3IDU4LjI1IDMwLjI3OTUgNTguMjUgMzEuNjM3MkM1OC4yNSAzMi4xNDAyIDU4LjIxNTMgMzIuNTkyMiA1OC4xNDY2IDMyLjk5NDlINDcuNjk0N0w0Ny43MDk3IDMzLjE0MzdDNDcuODE3OSAzNC4wNzg0IDQ4LjE3MzkgMzQuODE2MyA0OC43Nzg3IDM1LjM1NzdDNDkuNDE1IDM1LjkyNzIgNTAuMTk4MiAzNi4yMTI0IDUxLjEyNzQgMzYuMjEyNEM1Mi40Njk1IDM2LjIxMjQgNTMuNDIzOSAzNS42NTA3IDUzLjk5MTYgMzQuNTI4SDU3Ljg4ODRMNTcuODM0NyAzNC42OTQxQzU3LjQwODQgMzUuOTYwMSA1Ni42MzU1IDM3LjAwNiA1NS41MTQ1IDM3LjgzMzNDNTQuMzQ0NSAzOC42OTY2IDUyLjkwNzYgMzkuMTI3NSA1MS4yMDQ3IDM5LjEyNzVDNDkuODI4NyAzOS4xMjc1IDQ4LjU5MzkgMzguODI5OCA0Ny41MDEzIDM4LjIzNTJDNDYuNDA4NyAzNy42NDA2IDQ1LjU1NzYgMzYuNzk4NCA0NC45NDY2IDM1LjcwODdDNDQuMzM1NSAzNC42MTk3IDQ0LjAzMDggMzMuMzYyMyA0NC4wMzA4IDMxLjkzOEM0NC4wMzA4IDMwLjcwODEgNDQuMjUwMyAyOS42MDU4IDQ0LjY4OTIgMjguNjMySDQzLjU1NTVMNDMuMzk2OCAyOC42MzQzQzQyLjY2NjYgMjguNjUzOSA0Mi4wNjc0IDI4LjgxMTQgNDEuNTk4NCAyOS4xMDZDNDEuMDk2MyAyOS40MjE3IDQwLjczMjQgMjkuODUzMyA0MC41MDY2IDMwLjQwMUM0MC4yODA4IDMwLjk0ODYgNDAuMTY3OSAzMS41NzM3IDQwLjE2NzkgMzIuMjc2NVYzNS44NDk3SDQ0LjA4MjFWMzkuMDY3MkgzMy4zNjY2VjM1Ljg0OTdIMzYuMjU2OFYyOC40MTAzSDMzLjM2NjZWMjUuMTkyN0gzOS44Nzc0TDM5Ljk5NjYgMjcuNjAyNkw0MC4wOTYxIDI3LjQzMDJDNDAuMzMyOSAyNy4wMzQ2IDQwLjYxMDggMjYuNjc5NyA0MC45Mjg5IDI2LjM2NEM0MS4yOTI5IDI2LjAwMzYgNDEuNzQzNyAyNS43MTg0IDQyLjI4MTMgMjUuNTA4NUM0Mi44MTg5IDI1LjI5NzcgNDMuNDcxMSAyNS4xOTI3IDQ0LjIzODQgMjUuMTkyN0g0NS44ODkyVjI2LjgzMDFDNDYuMzQwOCAyNi4zNTM4IDQ2Ljg2NSAyNS45NTM1IDQ3LjQ2MzQgMjUuNjI5OUM0OC41NDc0IDI1LjA0MzEgNDkuNzk0NyAyNC43NTAxIDUxLjIwNTUgMjQuNzUwMUw1MS4yMDQ3IDI0Ljc0OTNaTTUxLjEwMTMgMjcuNjQwMkM1MC4yMDY4IDI3LjY0MDIgNDkuNDUzNyAyNy45MDQyIDQ4Ljg0MzQgMjguNDMyMkM0OC4yMzI0IDI4Ljk2MDIgNDcuODU4MiAyOS42OTM1IDQ3LjcyMDggMzAuNjMyMUg1NC41MDc5QzU0LjQ5MDUgMjkuNzI3MiA1NC4xNTUgMjkuMDAyNSA1My41MDEzIDI4LjQ1NzNDNTIuODQ3NiAyNy45MTIgNTIuMDQ3OSAyNy42NDAyIDUxLjEwMTMgMjcuNjQwMloiIGZpbGw9IiMxMTExMTEiLz4KPC9zdmc+Cg==',
    rdns: 'app.core.mobile'
  };

  function announceProvider() {
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info: providerInfo, provider: provider })
    }));
  }
  window.addEventListener('eip6963:requestProvider', announceProvider);
  announceProvider();

  // ──────────────────────────────────────────────
  // 7. Legacy events
  // ──────────────────────────────────────────────
  window.dispatchEvent(new Event('ethereum#initialized'));

  // ──────────────────────────────────────────────
  // 8. Send domain metadata to native (deferred until DOM is ready)
  // ──────────────────────────────────────────────
  function safeSend(msg) {
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    } catch(e) { /* bridge not yet available */ }
  }

  function sendDomainMetadata() {
    var name = document.title || window.location.hostname;
    var icon = '';
    var links = document.querySelectorAll('link[rel~="icon"]');
    if (links.length > 0) icon = links[links.length - 1].href || '';
    safeSend({
      method: 'domain_metadata',
      payload: JSON.stringify({
        domain: window.location.hostname,
        name: name,
        icon: icon,
        url: window.location.href
      })
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    sendDomainMetadata();
  } else {
    document.addEventListener('DOMContentLoaded', sendDomainMetadata);
  }

  safeSend({ method: 'log', payload: 'Core EVM provider injected (chainId=' + _chainId + ')' });
})();`
}
