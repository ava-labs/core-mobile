/**
 * Static HTML payload loaded into the chart WebView.
 *
 * Hosts TradingView's Charting Library from the Ava-Labs CDN
 * (`https://charting.core.app/`) and renders a chart for the symbol passed in
 * via the `?coin=` query param on the WebView `baseUrl`. Falls back to `BTC`.
 *
 * Live market data is fetched directly from Hyperliquid's public API:
 *   - REST  POST `https://api.hyperliquid.xyz/info` (`candleSnapshot`) for
 *           historical bars.
 *   - WS    `wss://api.hyperliquid.xyz/ws` (`candle` channel) for live ticks.
 *
 * This bypasses `@avalabs/perps-sdk`'s `createTradingViewDatafeed` — we'll
 * swap to the SDK when we have a bundling pipeline / charting.core.app deploy.
 * The protocol shapes match what the SDK uses internally, so the migration is
 * a drop-in.
 */
export const CHART_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: transparent; }
    #tv-chart { width: 100%; height: 100%; }
    #err { padding: 16px; color: #f55; font-family: -apple-system, system-ui, sans-serif; font-size: 13px; }
  </style>
</head>
<body>
  <div id="tv-chart"></div>
  <div id="err"></div>
  <script
    src="https://charting.core.app/charting_library.standalone.js"
    onerror="document.getElementById('err').textContent = 'Failed to load TradingView Charting Library'"></script>
  <script>
    (function () {
      var COIN = 'BTC';
      var THEME = 'dark';
      var BG = null;
      var INITIAL_RES = '60';
      try {
        var hash = (location.hash || '').replace(/^#/, '');
        var coinMatch  = hash.match(/coin=([^&]+)/);
        var themeMatch = hash.match(/theme=([^&]+)/);
        var bgMatch    = hash.match(/bg=([^&]+)/);
        var resMatch   = hash.match(/res=([^&]+)/);
        if (coinMatch && coinMatch[1])   COIN  = decodeURIComponent(coinMatch[1]);
        if (themeMatch && themeMatch[1]) THEME = decodeURIComponent(themeMatch[1]) === 'light' ? 'light' : 'dark';
        if (bgMatch && bgMatch[1])       BG    = decodeURIComponent(bgMatch[1]);
        if (resMatch && resMatch[1])     INITIAL_RES = decodeURIComponent(resMatch[1]);
      } catch (_) {}

      var IS_LIGHT = THEME === 'light';
      // Fallback to k2-alpine $surfacePrimary defaults if no bg was supplied.
      if (!BG) BG = IS_LIGHT ? '#FFFFFF' : '#28282E';
      // Paint the HTML body so the surface matches the host RN screen even
      // before TV finishes rendering its panes on top.
      document.body.style.backgroundColor = BG;
      var SUPPORTED_RES = ['60', '240', '1D', '1W', '1M'];

      // Palette mirrors core-web's perps page (apps/core/app/perps/utils/palette.ts).
      var PERPS_GREEN = '#1FA95E';
      var PERPS_RED   = '#E84142';

      function tvOverridesForTheme(isLight) {
        var grid      = isLight ? 'rgba(40, 40, 46, 0.1)'  : 'rgba(255, 255, 255, 0.1)';
        var axisText  = isLight ? 'rgba(40, 40, 46, 0.3)'  : 'rgba(255, 255, 255, 0.3)';
        var crosshair = isLight ? 'rgba(40, 40, 46, 0.35)' : 'rgba(255, 255, 255, 0.35)';
        return {
          'paneProperties.backgroundType': 'solid',
          'paneProperties.background': BG,
          'paneProperties.vertGridProperties.color': grid,
          'paneProperties.vertGridProperties.style': 2,
          'paneProperties.horzGridProperties.color': grid,
          'paneProperties.horzGridProperties.style': 2,
          'paneProperties.crossHairProperties.color': crosshair,
          'paneProperties.crossHairProperties.style': 2,
          'paneProperties.separatorColor': grid,
          'paneProperties.legendProperties.showBackground': false,
          'paneProperties.legendProperties.showSeriesOHLC': true,
          'scalesProperties.lineColor': grid,
          'scalesProperties.textColor': axisText,
          'scalesProperties.fontSize': 11,
          'mainSeriesProperties.statusViewStyle.fontSize': 11,
          'mainSeriesProperties.statusViewStyle.showExchange': false,
          'mainSeriesProperties.candleStyle.upColor': PERPS_GREEN,
          'mainSeriesProperties.candleStyle.downColor': PERPS_RED,
          'mainSeriesProperties.candleStyle.borderUpColor': PERPS_GREEN,
          'mainSeriesProperties.candleStyle.borderDownColor': PERPS_RED,
          'mainSeriesProperties.candleStyle.wickUpColor': PERPS_GREEN,
          'mainSeriesProperties.candleStyle.wickDownColor': PERPS_RED,
          'mainSeriesProperties.showPriceLine': true,
          'mainSeriesProperties.priceLineWidth': 2
        };
      }

      var TV_STUDIES_OVERRIDES = {
        'volume.volume.plottype': 'columns',
        'volume.volume.transparency': 70,
        'volume.volume.color.0': PERPS_GREEN,
        'volume.volume.color.1': PERPS_RED,
        'volume.volume ma:plot.display': 0
      };

      var HL_REST = 'https://api.hyperliquid.xyz/info';
      var HL_WS   = 'wss://api.hyperliquid.xyz/ws';

      // TV resolution → Hyperliquid candle interval string.
      var RES_TO_HL = {
        '1': '1m', '3': '3m', '5': '5m', '15': '15m', '30': '30m',
        '60': '1h', '120': '2h', '240': '4h', '480': '8h', '720': '12h',
        '1D': '1d', '3D': '3d', '1W': '1w', '1M': '1M'
      };

      function intervalForRes(res) { return RES_TO_HL[res] || '1h'; }

      function hlCandleToBar(c) {
        return {
          time: c.t, // open time ms — TV uses this as the bar key
          open:   parseFloat(c.o),
          high:   parseFloat(c.h),
          low:    parseFloat(c.l),
          close:  parseFloat(c.c),
          volume: parseFloat(c.v)
        };
      }

      function makeHyperliquidDatafeed() {
        // listenerGuid → { coin, interval, onTick }
        var listeners = {};
        var ws = null;
        var wsReady = false;
        var queued = [];

        function flushQueue() {
          while (queued.length) ws.send(JSON.stringify(queued.shift()));
        }
        function sendOrQueue(msg) {
          ensureWs();
          if (wsReady) ws.send(JSON.stringify(msg));
          else queued.push(msg);
        }
        function resubscribeAll() {
          Object.keys(listeners).forEach(function (g) {
            var l = listeners[g];
            sendOrQueue({
              method: 'subscribe',
              subscription: { type: 'candle', coin: l.coin, interval: l.interval }
            });
          });
        }
        function ensureWs() {
          if (ws) return;
          ws = new WebSocket(HL_WS);
          ws.onopen = function () { wsReady = true; flushQueue(); };
          ws.onmessage = function (evt) {
            try {
              var msg = JSON.parse(evt.data);
              if (msg.channel !== 'candle' || !msg.data) return;
              var d = msg.data;
              var bar = hlCandleToBar(d);
              Object.keys(listeners).forEach(function (g) {
                var l = listeners[g];
                if (l.coin === d.s && l.interval === d.i) l.onTick(bar);
              });
            } catch (_) {}
          };
          ws.onclose = function () {
            ws = null;
            wsReady = false;
            // Reconnect if anyone still wants ticks.
            if (Object.keys(listeners).length === 0) return;
            setTimeout(resubscribeAll, 1500);
          };
          ws.onerror = function () { /* let onclose handle reconnect */ };
        }

        return {
          onReady: function (cb) {
            setTimeout(function () {
              cb({
                supported_resolutions: SUPPORTED_RES,
                supports_marks: false,
                supports_time: true
              });
            }, 0);
          },
          searchSymbols: function (_q, _e, _t, cb) { cb([]); },
          resolveSymbol: function (name, onResolve, _onError) {
            setTimeout(function () {
              onResolve({
                name: name,
                ticker: name,
                description: name,
                type: 'crypto',
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: 'Hyperliquid',
                listed_exchange: 'Hyperliquid',
                format: 'price',
                minmov: 1,
                pricescale: 100,
                has_intraday: true,
                supported_resolutions: SUPPORTED_RES,
                volume_precision: 4,
                data_status: 'streaming'
              });
            }, 0);
          },
          getBars: function (symbolInfo, resolution, periodParams, onResult, onError) {
            var body = {
              type: 'candleSnapshot',
              req: {
                coin: symbolInfo.name,
                interval: intervalForRes(resolution),
                startTime: periodParams.from * 1000,
                endTime:   periodParams.to   * 1000
              }
            };
            fetch(HL_REST, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (!Array.isArray(data) || data.length === 0) {
                  onResult([], { noData: true });
                  return;
                }
                var bars = data.map(hlCandleToBar);
                onResult(bars, { noData: false });
              })
              .catch(function (e) {
                if (onError) onError(String(e && e.message ? e.message : e));
              });
          },
          subscribeBars: function (symbolInfo, resolution, onTick, listenerGuid) {
            var interval = intervalForRes(resolution);
            listeners[listenerGuid] = {
              coin: symbolInfo.name,
              interval: interval,
              onTick: onTick
            };
            sendOrQueue({
              method: 'subscribe',
              subscription: { type: 'candle', coin: symbolInfo.name, interval: interval }
            });
          },
          unsubscribeBars: function (listenerGuid) {
            var l = listeners[listenerGuid];
            if (!l) return;
            delete listeners[listenerGuid];
            if (wsReady) {
              try {
                ws.send(JSON.stringify({
                  method: 'unsubscribe',
                  subscription: { type: 'candle', coin: l.coin, interval: l.interval }
                }));
              } catch (_) {}
            }
          }
        };
      }

      function bootstrap() {
        if (!window.TradingView || !window.TradingView.widget) {
          setTimeout(bootstrap, 50);
          return;
        }
        try {
          var overrides = tvOverridesForTheme(IS_LIGHT);
          var widget = new window.TradingView.widget({
            autosize: true,
            symbol: COIN,
            interval: INITIAL_RES,
            container: 'tv-chart',
            library_path: 'https://charting.core.app/',
            locale: 'en',
            theme: IS_LIGHT ? 'light' : 'dark',
            toolbar_bg: BG,
            custom_font_family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            disabled_features: [
              'use_localstorage_for_settings',
              'header_widget',
              'left_toolbar',
              'timeframes_toolbar',
              'legend_widget',
              'border_around_the_chart',
              'remove_library_container_border',
              'time_scale_menu_button',
              'control_bar',
              'context_menus',
              'popup_hints',
              'display_market_status'
            ],
            charts_storage_url: '',
            charts_storage_api_version: '1.1',
            client_id: 'core-mobile',
            user_id: 'public_user_id',
            overrides: overrides,
            studies_overrides: TV_STUDIES_OVERRIDES,
            datafeed: makeHyperliquidDatafeed()
          });

          // Expose the widget so the RN side can call setResolution / other
          // chart APIs via WebView.injectJavaScript without a postMessage
          // round-trip. Set both before and after onChartReady so early
          // injections from RN (fired before TV finishes booting) can queue.
          window.tvWidget = widget;

          // applyOverrides after init for properties that aren't honored by
          // the initial config object (e.g. some build-specific palette keys).
          widget.onChartReady(function () {
            try { widget.applyOverrides(overrides); } catch (_) {}
            try { widget.applyStudiesOverrides(TV_STUDIES_OVERRIDES); } catch (_) {}
          });
        } catch (e) {
          document.getElementById('err').textContent = 'TV init error: ' + (e && e.message ? e.message : String(e));
        }
      }

      bootstrap();
    })();
  </script>
</body>
</html>`
