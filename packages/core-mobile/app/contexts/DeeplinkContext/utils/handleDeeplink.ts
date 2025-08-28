import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import { parseUri } from '@walletconnect/utils'
import { WalletConnectVersions } from 'store/walletConnectV2/types'
import { newSession } from 'store/walletConnectV2/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { router } from 'expo-router'
import { History } from 'store/browser'
import { navigateFromDeeplinkUrl } from 'utils/navigateFromDeeplink'
import { dismissMeldStack } from 'features/meld/utils'
import { offrampSend } from 'store/meld/slice'
import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { hasRouteByName, NavState } from 'common/utils/hasRouteByName'
import { ACTIONS, DeepLink, PROTOCOLS } from '../types'

export const handleDeeplink = ({
  deeplink,
  dispatch,
  isEarnBlocked,
  openUrl,
  navigationState
}: {
  deeplink: DeepLink
  dispatch: Dispatch
  isEarnBlocked: boolean
  openUrl: (history: Pick<History, 'url' | 'title'>) => void
  navigationState?: NavState
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): void => {
  let url
  try {
    url = new URL(deeplink.url)
  } catch (e) {
    return
  }
  const protocol = url.protocol.replace(':', '')
  switch (protocol) {
    case PROTOCOLS.WC: {
      const uri = url.href
      const { version } = parseUri(uri)
      dispatchWalletConnectSession(version, uri, dispatch)
      break
    }
    case PROTOCOLS.HTTPS: {
      if (CORE_UNIVERSAL_LINK_HOSTS.includes(url.hostname)) {
        const action = url.pathname.split('/')[1]
        if (action === ACTIONS.WC) {
          startWalletConnectSession({ url, dispatch, deeplink })
          break
        }
      }

      // if not a wc link, just open the url in the browser tab
      openUrl({
        url: deeplink.url,
        title: ''
      })
      break
    }
    case PROTOCOLS.CORE: {
      const { host: action, pathname, searchParams } = url
      if (action === ACTIONS.WC) {
        startWalletConnectSession({ url, dispatch, deeplink })
      } else if (action === ACTIONS.StakeComplete) {
        if (isEarnBlocked) return
        deeplink.callback?.()
        navigateFromDeeplinkUrl('/claimStakeReward')
      } else if (action === ACTIONS.WatchList) {
        const tokenId = pathname.split('/')[1]
        if (tokenId) {
          // All watchlist tokens now use internalId format
          navigateFromDeeplinkUrl(`/trackTokenDetail?tokenId=${tokenId}`)
        }
      } else if (action === ACTIONS.OfframpCompleted) {
        dispatch(offrampSend({ searchParams }))
      } else if (action === ACTIONS.OnrampCompleted) {
        closeInAppBrowser()
        dismissMeldStack(action, searchParams)
      } else {
        const hasPortfolioRoute = hasRouteByName(navigationState, 'portfolio')
        const path = deeplink.url.split(':/')[1]
        path && navigateFromDeeplinkUrl(path, hasPortfolioRoute)
      }
      break
    }
    default:
      return
  }
}

const startWalletConnectSession = ({
  url,
  dispatch,
  deeplink
}: {
  url: URL
  dispatch: Dispatch<AnyAction>
  deeplink: DeepLink
}): void => {
  const uri = url.searchParams.get('uri')
  if (uri) {
    const { version } = parseUri(uri)
    dispatchWalletConnectSession(version, uri, dispatch)
  } else {
    Logger.info(`${deeplink.url} is not a wallet connect link`)
  }
}

/**
 * the following formats for WC link are supported:
 * - https://core.app/wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 * - wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 * - core://wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 */
const dispatchWalletConnectSession = (
  version: number,
  uri: string,
  dispatch: Dispatch<AnyAction>
): void => {
  // link is a valid wallet connect uri
  const versionStr = version.toString()
  if (versionStr === WalletConnectVersions.V1) {
    showSnackbar('WalletConnect V1 is not supported')
  } else if (versionStr === WalletConnectVersions.V2) {
    dispatch(newSession(uri))
  }
}
