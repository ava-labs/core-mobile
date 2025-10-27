// PerformanceTracker.js

// eslint-disable-next-line @discordapp/discord/no-native-alert
import {Alert} from 'react-native';
import performance, {PerformanceObserver} from 'react-native-performance';

/**
 * We expect the app (or react-native-performance) to emit exactly these four
 * “react-native-mark” entries automatically at startup:
 *
 *   ‣ nativeLaunchStart
 *   ‣ nativeLaunchEnd
 *   ‣ runJsBundleStart
 *   ‣ runJsBundleEnd
 *
 * In addition, the user will manually call markTTI() at the moment they
 * consider the UI fully interactive.  That “tti” mark is a plain `performance.mark('tti')`.
 *
 * Once we know all three “end”‐marks exist— i.e.:
 *   • nativeLaunchEnd
 *   • runJsBundleEnd
 *   • tti
 * —then we fire off three measurements and immediately show an Alert.
 */

const REQUIRED_FLAGS = {
  sawNativeLaunchEnd: false,
  sawRunJsBundleEnd: false,
  sawTTI: false,
  sawTTIRender: false,
  sawAuthIsDone: false,
  sawAppReady: false,
};

// Only show the final Alert once:
let hasFiredAlert = false;

// Utility: once all three flags are true, measure & alert exactly once.
function tryMeasureAndAlertReactNativeMarks() {
  if (hasFiredAlert) {
    return;
  }

  const rnObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'nativeLaunchEnd') {
      REQUIRED_FLAGS.sawNativeLaunchEnd = true;
    } else if (entry.name === 'runJsBundleEnd') {
      REQUIRED_FLAGS.sawRunJsBundleEnd = true;
    }
  }
 
});

// Start observing RIGHT AWAY, buffered = true so we catch any marks that
// happened *before* this script was imported.
rnObserver.observe({
  type: 'react-native-mark',
  buffered: true,
});

  const con = console
  con.log('REQUIRED_FLAGS', REQUIRED_FLAGS)

  const {sawNativeLaunchEnd, sawRunJsBundleEnd, sawTTI, sawTTIRender, sawAuthIsDone, sawAppReady} = REQUIRED_FLAGS;
  if (!sawNativeLaunchEnd || !sawRunJsBundleEnd || !sawTTI || !sawTTIRender || !sawAuthIsDone || !sawAppReady) {
    const con = console; con.log('Not all required flags seen yet:', REQUIRED_FLAGS);
    return;
  }

  // By the time we get here, we know:
  //   • performance.getEntriesByName('nativeLaunchEnd') exists
  //   • performance.getEntriesByName('runJsBundleEnd') exists
  //   • performance.getEntriesByName('tti') exists
  //
  // Now we perform our three measures, *inside* the PO callbacks,
  // so we don't risk calling `measure(...)` prematurely.

  // 1) nativeLaunch  = nativeLaunchEnd – nativeLaunchStart
  performance.measure('nativeLaunch', 'nativeLaunchStart', 'nativeLaunchEnd');

  performance.measure('beforeJsBundle', 'nativeLaunchStart', 'runJsBundleStart');

  // 2) runJsBundle   = runJsBundleEnd – runJsBundleStart
  performance.measure('runJsBundle', 'runJsBundleStart', 'runJsBundleEnd');

  // 3) timeToInteractive = tti – runJsBundleEnd
  performance.measure('timeToInteractive', 'runJsBundleStart', 'tti');

  performance.measure('timeToRender', 'authIsDone', 'ttiRender');

  performance.measure('timeAfterAuthIsDone', 'authIsDone', 'appReady');

  // Extract those three measurements:
  const beforeJsBundleEntry = performance.getEntriesByName('beforeJsBundle').pop();
  const nativeLaunchEntry = performance.getEntriesByName('nativeLaunch').pop();
  const runJsEntry = performance.getEntriesByName('runJsBundle').pop();
  const ttiEntry = performance.getEntriesByName('timeToInteractive').pop();
  const ttiRender = performance.getEntriesByName('timeToRender').pop();
  const timeAfterAuthIsDone = performance.getEntriesByName('timeAfterAuthIsDone').pop();

  const nativeLaunchMs = nativeLaunchEntry ? nativeLaunchEntry.duration.toFixed(2) : 'n/a';
  const runJsMs = runJsEntry ? runJsEntry.duration.toFixed(2) : 'n/a';
  const ttiMs = ttiEntry ? ttiEntry.duration.toFixed(2) : 'n/a';
  const ttiRenderMs = ttiRender ? ttiRender.duration.toFixed(2) : 'n/a';
  const beforeJsBundleMs = beforeJsBundleEntry ? beforeJsBundleEntry.duration.toFixed(2) : 'n/a';
  const timeAfterAuthIsDoneMs = timeAfterAuthIsDone ? timeAfterAuthIsDone.duration.toFixed(2) : 'n/a';

  Alert.alert(
    'Startup Metrics (non-static)',
    `• nativeLaunch: ${nativeLaunchMs} ms\n`
      + `• runJsBundle: ${runJsMs} ms\n`
      + `• timeToPinlock: ${ttiMs} ms\n`
      + `• beforeJsBundleEval: ${beforeJsBundleMs} ms\n`
      + `• TimeToRenderTokenItem: ${ttiRenderMs} ms\n`
      + `• TimeToLayoutTokenItem: ${timeAfterAuthIsDoneMs} ms`,
  );

  hasFiredAlert = true;
}

let rnObserver = null;
let genericObserver = null;

export const observe = () => {
    const con = console
    con.log('Starting PerformanceTracer observe()')
    // OBSERVER #1: listen for “react-native-mark” entries
    // --------------------------------
    // This catches both
    //    • “nativeLaunchEnd”
    //    • “runJsBundleEnd”
    // which are logged internally by React Native or react-native-performance
    // as soon as JS bundle has finished evaluation.
    rnObserver = new PerformanceObserver((list) => {
        const con = console
        const marks = performance.getEntriesByType('react-native-mark')
        con.log('RN MARK ENTRIES:', marks.length)
        
         
    for (const entry of marks) {
        console.log('RN MARK:', entry.name)
        if (entry.name === 'nativeLaunchEnd') {
        REQUIRED_FLAGS.sawNativeLaunchEnd = true;
        } else if (entry.name === 'runJsBundleEnd') {
        REQUIRED_FLAGS.sawRunJsBundleEnd = true;
        }
    }
    tryMeasureAndAlertReactNativeMarks();
    });

    // Start observing RIGHT AWAY, buffered = true so we catch any marks that
    // happened *before* this script was imported.
    rnObserver.observe({
    type: 'react-native-mark',
    buffered: true,
    });

// OBSERVER #2: listen for plain “mark” entries
// --------------------------------
// This will catch the user‐invoked TTI mark:
//    performance.mark('tti')
    genericObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.name === 'tti') {
        REQUIRED_FLAGS.sawTTI = true;
        }
    }
    tryMeasureAndAlertReactNativeMarks();
    });

    genericObserver.observe({type: 'mark', buffered: true});
}

/**
 * Call this the moment your UI is fully interactive.  For example:
 *
 *   import { markTTI } from './PerformanceTracker';
 *   // …later, after your top‐level navigation has rendered:
 *   markTTI();
 */
export function markTTIFinal(timestamp?: number) {
    if (REQUIRED_FLAGS.sawTTI) {
        return;
    }
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('Performance API not available—cannot mark TTI.');
    return;
  }

  // Create the “tti” mark.  OBSERVER #2 will catch it.

  if (timestamp) {
    performance.mark('tti', {
      startTime: timestamp
    });
  } else {
    performance.mark('tti');
  }

  // In case the other two “react-native-mark” entries have already come and gone,
  // we force-set this flag and try one more time to measure+alert:
  REQUIRED_FLAGS.sawTTI = true;
  tryMeasureAndAlertReactNativeMarks();
}

export function markTIIRender(timestamp?: number) {
    if (REQUIRED_FLAGS.sawTTIRender) {
        return;
    }
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('Performance API not available—cannot mark TTI.');
    return;
  }


  // Create the “tti” mark.  OBSERVER #2 will catch it.
  if (timestamp) {
    performance.mark('ttiRender', {
      startTime: timestamp
    });
  } else {
    performance.mark('ttiRender');
  }

  // In case the other two “react-native-mark” entries have already come and gone,
  // we force-set this flag and try one more time to measure+alert:
  REQUIRED_FLAGS.sawTTIRender = true;
  tryMeasureAndAlertReactNativeMarks();
}

export function markAuthIsDone() {
    if (REQUIRED_FLAGS.sawAuthIsDone) {
        return;
    }
    if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('Performance API not available—cannot mark AuthIsDone.');
    return;
  }
  
  performance.mark('authIsDone');
  REQUIRED_FLAGS.sawAuthIsDone = true;
  tryMeasureAndAlertReactNativeMarks();
}

export function markAppReady() {
    if (REQUIRED_FLAGS.sawAppReady) {
        return;
    }
    if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('Performance API not available—cannot mark AppReady.');
    return;
  }
  
  performance.mark('appReady');
  REQUIRED_FLAGS.sawAppReady = true;
  tryMeasureAndAlertReactNativeMarks();
}
