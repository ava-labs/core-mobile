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
      var e = new Error(error.message || 'Unknown error');
      e.code = error.code;
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

      // wallet_switchEthereumChain: optimistically update local chain state
      // SYNCHRONOUSLY before the bridge round-trip.  This fires chainChanged
      // before wagmi sets status:'pending', so ConnectKit re-renders already
      // see the target chainId and don't call switchChain again — preventing
      // the React error #185 infinite-loop that occurs over an async bridge.
      if (method === 'wallet_switchEthereumChain') {
        if (_pendingInteractive['wallet_switchEthereumChain']) {
          return Promise.reject({ code: -32002, message: 'wallet_switchEthereumChain already pending' });
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
              // from the 4001 rejection; keeping _chainId at target prevents the
              // re-trigger. The dApp receives the 4001 and shows its rejection UX.
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
            reject({ code: -32603, message: 'Bridge unavailable' });
          }
        });
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
      // NOTE: do NOT auto-fire current state to new listeners here.
      // Auto-firing 'accountsChanged'/'connect' on every on() call causes
      // wagmi to re-subscribe during its cleanup/setup cycle, which feeds
      // back into another auto-fire, producing React error #185 (infinite
      // update loop) when a dApp triggers chain-switch UI.
      // wagmi discovers initial connection state via eth_accounts /
      // eth_requestAccounts requests, not via event replays.
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

  // ──────────────────────────────────────────────
  // 10. Error capture — forward JS errors to Metro for debugging
  // ──────────────────────────────────────────────
  (function() {
    var origConsoleError = console.error;
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function(a) {
        try {
          if (a instanceof Error) {
              var errLabel = (a.name || 'Error') + ': ' + (a.message || '');
              return errLabel + (a.stack ? '\\n' + a.stack : '');
            }
          if (typeof a === 'object' && a !== null) {
            var json = JSON.stringify(a);
            return (json === '{}' || json === 'null') ? String(a) : json;
          }
          return String(a);
        } catch(e) { return String(a); }
      }).join(' ');
      safeSend({ method: 'log', payload: '[console.error] ' + msg });
      origConsoleError.apply(console, arguments);
    };
    window.addEventListener('unhandledrejection', function(e) {
      var reason = '';
      try {
        if (e.reason instanceof Error) {
          reason = (e.reason.name || 'Error') + ': ' + (e.reason.message || '') + (e.reason.stack ? '\\n' + e.reason.stack : '');
        } else {
          reason = String(e.reason);
        }
      } catch(_) { reason = 'unknown'; }
      safeSend({ method: 'log', payload: '[unhandledrejection] ' + reason });
    });
    window.addEventListener('error', function(e) {
      safeSend({ method: 'log', payload: '[error] ' + e.message + ' at ' + e.filename + ':' + e.lineno + ':' + e.colno });
    });
  })();

  safeSend({ method: 'log', payload: 'Core EVM provider injected (chainId=' + _chainId + ')' });
})();`
}
