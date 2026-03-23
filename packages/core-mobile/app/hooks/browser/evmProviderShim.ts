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
  INJECTED_PROVIDER_NAME,
  INJECTED_PROVIDER_RDNS,
  INJECTED_PROVIDER_ICON
} from './injectedProviderConstants'

export function buildEvmProviderShim({
  chainId,
  address,
  uuid
}: {
  chainId: string // hex, e.g. '0xa86a'
  address: string // e.g. '0x1234...'
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
  // 2. State
  // ──────────────────────────────────────────────
  var _requestId = 0;
  var _callbacks = {};
  var _listeners = {};
  var _pendingInteractive = {};
  var INTERACTIVE_METHODS = {
    'wallet_switchEthereumChain': true,
    'wallet_addEthereumChain': true
  };
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

      if (INTERACTIVE_METHODS[method] && _pendingInteractive[method]) {
        return Promise.reject({ code: -32002, message: 'Request of type ' + method + ' already pending for origin. Please wait.' });
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
  // 5. Install provider globals
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
    uuid: '${uuid}',
    name: '${INJECTED_PROVIDER_NAME}',
    icon: '${INJECTED_PROVIDER_ICON}',
    rdns: '${INJECTED_PROVIDER_RDNS}'
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

  // ──────────────────────────────────────────────
  // 9. SPA navigation listener
  // ──────────────────────────────────────────────
  (function() {
    var lastUrl = window.location.href;
    function onUrlChange() {
      var newUrl = window.location.href;
      if (newUrl !== lastUrl) {
        lastUrl = newUrl;
        safeSend({ method: 'nav_change', payload: newUrl });
      }
    }
    var origPushState = history.pushState;
    history.pushState = function() {
      origPushState.apply(history, arguments);
      onUrlChange();
    };
    var origReplaceState = history.replaceState;
    history.replaceState = function() {
      origReplaceState.apply(history, arguments);
      onUrlChange();
    };
    window.addEventListener('popstate', onUrlChange);
  })();

  safeSend({ method: 'log', payload: 'Core EVM provider injected (chainId=' + _chainId + ')' });
})();`
}
