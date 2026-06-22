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
import {
  BRIDGE_UNAVAILABLE_MESSAGE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  JSON_RPC_RESOURCE_UNAVAILABLE_CODE
} from './injectedProvider/errors'
import {
  INJECTED_PROVIDER_NAME,
  INJECTED_PROVIDER_RDNS,
  INJECTED_PROVIDER_ICON
} from './injectedProviderConstants'

export function buildEvmProviderShim({
  chainId,
  uuid
}: {
  chainId: string // hex, e.g. '0xa86a'
  // Accepted for caller compatibility but intentionally NOT embedded: accounts
  // are primed via __coreProviderEmit('accountsChanged', ...) after the user
  // approves a connection, never pre-seeded into the shim. See tests.
  address?: string
  uuid: string // stable UUIDv4 persisted across restarts
}): string {
  return `(function() {
  'use strict';

  // ──────────────────────────────────────────────
  // 1. Injection guards
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
  // 2. Desktop user-agent override (DEFERRED)
  // ──────────────────────────────────────────────
  // dApp wallet-connect libraries (RainbowKit, Web3Modal, etc.) render
  // a stripped-down mobile modal that hides EIP-6963 injected wallets.
  // Their desktop modals show all detected wallets including an
  // "Installed" section.  Overriding navigator.userAgent to a desktop
  // string makes these libraries render the full desktop connect UI.
  //
  // IMPORTANT: The override is DEFERRED until after page load so that
  // dApps can still detect the mobile environment during initialisation
  // and auto-connect to window.ethereum (e.g. Aave, Uniswap).
  // Once the page has loaded, the override activates — any connect modal
  // opened afterwards (RainbowKit, Web3Modal) will render the desktop UI
  // that shows EIP-6963 detected wallets.
  var _desktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  var _uaOverridden = false;
  function _applyDesktopUA() {
    if (_uaOverridden) return;
    _uaOverridden = true;
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: function() { return _desktopUA; },
        configurable: true
      });
    } catch(_e) {}
  }
  window.addEventListener('load', function() { setTimeout(_applyDesktopUA, 200); });
  setTimeout(_applyDesktopUA, 4000);

  // ──────────────────────────────────────────────
  // 3. State
  // ──────────────────────────────────────────────
  var _requestId = 0;
  var _callbacks = {};
  var _listeners = {};
  var _pendingInteractive = {};
  var INTERACTIVE_METHODS = {
    'eth_requestAccounts': true,
    'wallet_requestPermissions': true,
    'wallet_addEthereumChain': true,
    'wallet_watchAsset': true
  };
  var _chainId = '${chainId}';
  // _accounts is seeded empty. Native primes it via
  // __coreProviderEmit('accountsChanged', [...]) on page load if the origin
  // already has a permission grant; otherwise the dApp must call
  // eth_requestAccounts to trigger the approval UI.
  var _accounts = [];

  // EIP-1193 connection state. Native emits disconnect(4901) when the active
  // chain isn't a servable EVM chain (CP-13671) and chainChanged when it
  // recovers; isConnected() must track that, since some dApps poll
  // isConnected() and ignore the disconnect event.
  var _connected = true;

  // ──────────────────────────────────────────────
  // 4. Native response / event bridge
  // ──────────────────────────────────────────────
  window.__coreProviderRespond = function(id, error, result) {
    var cb = _callbacks[id];
    if (!cb) return;
    delete _callbacks[id];
    if (error) {
      var e = new Error(error.message || 'Unknown error');
      e.code = error.code;
      if (error.data !== undefined) { e.data = error.data; }
      cb.reject(e);
    } else {
      cb.resolve(result);
    }
  };

  window.__coreProviderEmit = function(eventName, data) {
    if (eventName === 'chainChanged') {
      _chainId = data;
      provider.chainId = data;
      provider.networkVersion = String(parseInt(data, 16));
      // Re-pointing to a servable EVM chain recovers from a CP-13671 disconnect.
      _connected = true;
    }
    if (eventName === 'accountsChanged') {
      _accounts = data || [];
      provider.selectedAddress = _accounts.length > 0 ? _accounts[0] : null;
    }
    if (eventName === 'connect') {
      _connected = true;
    }
    if (eventName === 'disconnect') {
      _connected = false;
    }
    // Keep the legacy _isConnected property in sync with the flag for dApps
    // that read provider._isConnected directly instead of calling isConnected().
    provider._isConnected = _connected;
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
  // 5. EIP-1193 provider
  // ──────────────────────────────────────────────
  var provider = {
    isMetaMask: true,
    isAvalanche: true,
    _isConnected: true,

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
        return Promise.resolve(_accounts.length > 0 ? _accounts[0] : null);
      }
      // Connect + permission methods round-trip to native so the user is prompted
      // (eth_requestAccounts, wallet_requestPermissions) or the permissions slice
      // is consulted (wallet_getPermissions, wallet_revokePermissions). The shim
      // keeps _accounts in sync via __coreProviderEmit on 'accountsChanged'.

      // wallet_switchEthereumChain: optimistically update local chain state
      // SYNCHRONOUSLY before the bridge round-trip.  This fires chainChanged
      // before wagmi sets status:'pending', so ConnectKit re-renders already
      // see the target chainId and don't call switchChain again — preventing
      // the React error #185 infinite-loop that occurs over an async bridge.
      if (method === 'wallet_switchEthereumChain') {
        if (_pendingInteractive['wallet_switchEthereumChain']) {
          return Promise.reject({ code: ${JSON_RPC_RESOURCE_UNAVAILABLE_CODE}, message: 'wallet_switchEthereumChain already pending' });
        }
        var swTargetChainId = (params[0] && params[0].chainId) || null;
        if (swTargetChainId && swTargetChainId !== _chainId) {
          _chainId = swTargetChainId;
          provider.chainId = swTargetChainId;
          provider.networkVersion = String(parseInt(swTargetChainId, 16));
          emit('chainChanged', swTargetChainId);
        }
        _pendingInteractive['wallet_switchEthereumChain'] = true;
        var swId = ++_requestId;
        return new Promise(function(resolve, reject) {
          _callbacks[swId] = {
            resolve: function(r) {
              delete _pendingInteractive['wallet_switchEthereumChain'];
              resolve(r);
            },
            reject: function(e) {
              delete _pendingInteractive['wallet_switchEthereumChain'];
              // Do NOT roll back _chainId on rejection. Rolling back fires
              // chainChanged(original), which ConnectKit's "ensure correct chain"
              // useEffect sees as a mismatch and re-calls switchChain — producing
              // React error #185 (infinite update loop). wagmi enters status:'error'
              // from the EIP-1193 user-rejected rejection; keeping _chainId at target prevents the
              // re-trigger. The dApp receives that rejection and shows its rejection UX.
              reject(e);
            }
          };
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              method: 'provider_request',
              payload: JSON.stringify({
                id: swId,
                origin: window.location.origin,
                request: { method: method, params: params }
              })
            }));
          } catch(swErr) {
            delete _pendingInteractive['wallet_switchEthereumChain'];
            reject({ code: ${JSON_RPC_INTERNAL_ERROR_CODE}, message: '${BRIDGE_UNAVAILABLE_MESSAGE}' });
          }
        });
      }

      if (INTERACTIVE_METHODS[method] && _pendingInteractive[method]) {
        return Promise.reject({ code: ${JSON_RPC_RESOURCE_UNAVAILABLE_CODE}, message: 'Request of type ' + method + ' already pending for origin. Please wait.' });
      }
      var isInteractive = !!INTERACTIVE_METHODS[method];
      if (isInteractive) _pendingInteractive[method] = true;

      // Everything else goes to native
      var id = ++_requestId;
      return new Promise(function(resolve, reject) {
        _callbacks[id] = {
          resolve: function(r) {
            if (isInteractive) delete _pendingInteractive[method];
            resolve(r);
          },
          reject: function(e) {
            if (isInteractive) delete _pendingInteractive[method];
            reject(e);
          }
        };

        var message = {
          method: 'provider_request',
          payload: JSON.stringify({
            id: id,
            origin: window.location.origin,
            request: { method: method, params: params }
          })
        };

        try {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } catch(e) {
          delete _callbacks[id];
          if (isInteractive) delete _pendingInteractive[method];
          reject({ code: ${JSON_RPC_INTERNAL_ERROR_CODE}, message: '${BRIDGE_UNAVAILABLE_MESSAGE}' });
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
      return provider;
    },
    addListener: function(event, fn) {
      return provider.on(event, fn);
    },
    once: function(event, fn) {
      function wrapped(data) {
        provider.removeListener(event, wrapped);
        fn(data);
      }
      return provider.on(event, wrapped);
    },
    removeListener: function(event, fn) {
      var fns = _listeners[event];
      if (!fns) return provider;
      _listeners[event] = fns.filter(function(f) { return f !== fn; });
      return provider;
    },
    off: function(event, fn) {
      return provider.removeListener(event, fn);
    },
    removeAllListeners: function(event) {
      if (event) delete _listeners[event];
      else _listeners = {};
      return provider;
    },
    listenerCount: function(event) {
      return (_listeners[event] || []).length;
    },
    listeners: function(event) {
      return (_listeners[event] || []).slice();
    },

    isConnected: function() {
      return _connected;
    },

    _metamask: {
      isUnlocked: function() { return Promise.resolve(true); }
    },

    chainId: _chainId,
    networkVersion: String(parseInt(_chainId, 16)),
    selectedAddress: null
  };

  // ──────────────────────────────────────────────
  // 6. Install provider globals
  // ──────────────────────────────────────────────
  // window.ethereum — standard EIP-1193 provider
  Object.defineProperty(window, 'ethereum', {
    get: function() { return provider; },
    set: function() {},
    configurable: false
  });

  // window.core — some dApps check window.core?.ethereum for Core wallet
  var coreNamespace = { ethereum: provider, isCore: true };
  Object.defineProperty(window, 'core', {
    get: function() { return coreNamespace; },
    set: function() {},
    configurable: false
  });

  // window.avalanche — legacy Core wallet detection used by some dApps
  Object.defineProperty(window, 'avalanche', {
    get: function() { return provider; },
    set: function() {},
    configurable: false
  });

  // ──────────────────────────────────────────────
  // 7. EIP-6963 announcement
  // ──────────────────────────────────────────────
  var providerInfo = Object.freeze({
    uuid: '${uuid}',
    name: '${INJECTED_PROVIDER_NAME}',
    icon: '${INJECTED_PROVIDER_ICON}',
    rdns: '${INJECTED_PROVIDER_RDNS}'
  });

  var _providerDetail = Object.freeze({
    info: providerInfo,
    provider: provider
  });

  function announceProvider() {
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
      detail: _providerDetail
    }));
  }
  window.addEventListener('eip6963:requestProvider', announceProvider);

  announceProvider();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', announceProvider);
  }
  window.addEventListener('load', announceProvider);

  setTimeout(announceProvider, 100);
  setTimeout(announceProvider, 1000);
  setTimeout(announceProvider, 3000);

  // ──────────────────────────────────────────────
  // 8. Legacy events & initial EIP-1193 connect
  // ──────────────────────────────────────────────
  window.dispatchEvent(new Event('ethereum#initialized'));
  // window.avalanche aliases this same provider; announce it too so X/P dApps
  // that wait on avalanche#initialized detect Core. (CP-13672)
  window.dispatchEvent(new Event('avalanche#initialized'));

  // EIP-1193: signal initial network connectivity.
  // Fired once via macrotask so that page scripts registering
  // listeners synchronously during HTML parsing can receive it.
  // disconnect is reserved for actual network/bridge loss.
  setTimeout(function() { emit('connect', { chainId: _chainId }); }, 0);

  // ──────────────────────────────────────────────
  // 9. Send domain metadata to native (deferred until DOM is ready)
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
