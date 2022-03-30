import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useState,
} from 'react';
import PostHog from 'posthog-react-native';
import {interval, startWith} from 'rxjs';
import Config from 'react-native-config';

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState,
);

enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  SWAP = 'swap-feature',
  BRIDGE = 'bridge-feature',
  SEND = 'send-feature',
}

export interface PosthogContextState {
  setAnalyticsConsent: Dispatch<boolean>;
  swapBlocked: boolean;
  bridgeBlocked: boolean;
  sendBlocked: boolean;
}

const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.SEND]: true,
};

const ONE_MINUTE = 6000;

export const PosthogContextProvider = ({children}: {children: any}) => {
  const [isPosthogReady, setIsPosthogReady] = useState(false);
  const [flags, setFlags] = useState<Record<FeatureGates, boolean>>(
    DefaultFeatureFlagConfig,
  );
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const swapBlocked = !flags['swap-feature'] || !flags.everything;
  const bridgeBlocked = !flags['bridge-feature'] || !flags.everything;
  const sendBlocked = !flags['send-feature'] || !flags.everything;

  useEffect(initPosthog, []);
  useEffect(reloadFlagsPeriodically, [isPosthogReady]);
  useEffect(checkConsent, [analyticsConsent, isPosthogReady]);

  function initPosthog() {
    (async function () {
      await PostHog.setup(Config.POSTHOG_API_KEY, {
        debug: true,
        host: 'https://data-posthog.avax.network',
        android: {
          collectDeviceId: false,
        },
      });
      await PostHog.disable();
      setIsPosthogReady(true);
    })();
  }

  function reloadFlagsPeriodically() {
    if (!isPosthogReady) {
      return;
    }
    const subscription = interval(ONE_MINUTE)
      .pipe(startWith(-1))
      .subscribe({
        next: i => {
          if (__DEV__ && i !== -1) {
            flags.everything = i % 2 === 0;
            setFlags({...flags});
          } else {
            reloadFeatureFlags();
          }
        },
      });

    return () => subscription?.unsubscribe();
  }

  function checkConsent() {
    if (!isPosthogReady) {
      return;
    }
    return; //FIXME: temporary, until Danny says so
    analyticsConsent ? PostHog.enable() : PostHog.disable();
  }

  function reloadFeatureFlags() {
    fetch('https://data-posthog.avax.network/decide?v=2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: Config.POSTHOG_API_KEY,
        distinct_id: '1234',
      }),
    })
      .catch(reason => console.error(reason))
      .then(value => value!.json())
      .then(value => {
        const result = value as {
          featureFlags: Record<FeatureGates, boolean>;
        };
        console.log('got flags', result.featureFlags);
        setFlags(result.featureFlags);
      });
  }

  return (
    <PosthogContext.Provider
      value={{
        setAnalyticsConsent,
        swapBlocked,
        bridgeBlocked,
        sendBlocked,
      }}>
      {children}
    </PosthogContext.Provider>
  );
};

export function usePosthogContext() {
  return useContext(PosthogContext);
}
