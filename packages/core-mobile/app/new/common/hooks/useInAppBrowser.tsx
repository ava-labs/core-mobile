import { resolve } from '@avalabs/core-utils-sdk'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Config from 'react-native-config'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Logger from 'utils/Logger'
import { openInAppBrowser } from 'utils/openInAppBrowser'
import { InAppBrowserOptions } from 'react-native-inappbrowser-reborn'
import { useTheme } from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'

const moonpayURL = async (address: string): Promise<{ url: string }> => {
  return await fetch(`${Config.PROXY_URL}/moonpay/${address}`).then(response =>
    response.json()
  )
}

const useInAppBrowser = (): {
  openUrl: (url: string) => Promise<void>
  openCoinBasePay: (address: string) => Promise<void>
  openMoonPay: () => Promise<void>
} => {
  const {
    theme: { colors }
  } = useTheme()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''

  // NOTE: these were previously plain `function` declarations. Two of them
  // (openMoonPay, openCoinBasePay) close over `openUrl`, which was declared
  // further down via a hoisted `async function openUrl` — that
  // declare-before-use pattern trips React Compiler's
  // "[PruneHoistedContexts] Rewrite hoisted function references" bailout,
  // which skips optimizing this ENTIRE hook. With no compiler memoization and
  // no manual useCallback, all three functions got a brand-new identity on
  // every render, which made every consumer's `useCallback(fn, [openUrl])`
  // (e.g. handleExplorerLink in useTokenDetailData) unstable too, even though
  // that call site was written correctly. Defining them as `const` +
  // useCallback (in dependency order) removes the hoisted-declaration
  // pattern and gives them a real, working identity independent of whether
  // the compiler is able to optimize this file.
  const openUrl = useCallback(
    async (url: string): Promise<void> => {
      const options: InAppBrowserOptions = {
        // iOS Properties
        dismissButtonStyle: 'close',
        preferredBarTintColor: colors.$surfacePrimary,
        preferredControlTintColor: colors.$textPrimary,
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: true,
        toolbarColor: colors.$surfacePrimary,
        secondaryToolbarColor: colors.$textPrimary,
        navigationBarColor: colors.$textPrimary,
        navigationBarDividerColor: colors.$surfaceSecondary,
        enableUrlBarHiding: false,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        showInRecents: true
      }
      openInAppBrowser(url, options)
    },
    [colors]
  )

  const openMoonPay = useCallback(async (): Promise<void> => {
    const [result, error] = await resolve(moonpayURL(addressC))
    if (error) {
      return showSnackbar(
        'We cannot send you to our partner, MoonPay, at this time. Please try again soon'
      )
    } else {
      const moonpayUrl = result?.url ?? ''
      return openUrl(moonpayUrl)
    }
  }, [addressC, openUrl])

  const openCoinBasePay = useCallback(
    async (address: string): Promise<void> => {
      const appId = Config.COINBASE_APP_ID
      if (!appId) {
        return showSnackbar(
          'We cannot send you to our partner, Coinbase, at this time. Please try again soon'
        )
      }
      const coinbaseUrl = generateOnRampURL({
        appId,
        addresses: { [address]: ['avacchain'] },
        assets: ['AVAX'],
        defaultExperience: 'buy'
      })
      openUrl(coinbaseUrl).catch(Logger.error)
    },
    [openUrl]
  )

  return { openUrl, openMoonPay, openCoinBasePay }
}

export default useInAppBrowser
