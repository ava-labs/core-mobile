import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import { parseUri } from '@walletconnect/utils'
import { WalletConnectVersions } from 'store/walletConnectV2/types'
import { newSession } from 'store/walletConnectV2/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { History } from 'store/browser'
import { navigateFromDeeplinkUrl } from 'utils/navigateFromDeeplink'
import { dismissMeldStack } from 'features/meld/utils'
import { offrampSend } from 'store/meld/slice'
import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { Href } from 'expo-router'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { tokenIds } from 'consts/tokenIds'
import { getAvalancheChainAliasCaip2 } from 'utils/caip2ChainIds'
import { ACTIONS, DeepLink, PROTOCOLS } from '../types'
import { DEEPLINK_WHITELIST } from '../consts'

const lowercasedDeeplinkWhitelist = DEEPLINK_WHITELIST.map(url =>
  url.toLowerCase()
)

/**
 * Where the stake-complete deeplink (a tapped stake-complete notification)
 * lands. Claim rewards are P-Chain AVAX; with Avalanche CCT available the
 * canonical way to move them back to C-Chain is a cross-chain swap, so the
 * deeplink opens the swap screen prefilled with the P → C AVAX pair —
 * mirroring the portfolio P-Chain AVAX detail's Swap action. While CCT is
 * unavailable it falls back to the legacy claim screen. First-time swappers
 * route through the swap onboarding, which forwards the prefill params to
 * the swap screen.
 */
const getStakeCompleteHref = ({
  shouldRedirectToCct,
  isDeveloperMode,
  shouldShowSwapOnboarding
}: {
  shouldRedirectToCct: boolean
  isDeveloperMode: boolean
  shouldShowSwapOnboarding: boolean
}): Href => {
  if (!shouldRedirectToCct) return '/claimStakeReward' as Href
  return {
    pathname: shouldShowSwapOnboarding ? '/swap/onboarding' : '/swap/swap',
    params: {
      initialTokenIdFrom: tokenIds.AVAX,
      initialFromCaip2Id: getAvalancheChainAliasCaip2('P', isDeveloperMode),
      initialTokenIdTo: tokenIds.AVAX,
      initialToCaip2Id: isDeveloperMode
        ? caip2ChainIds.FUJI
        : caip2ChainIds.C_CHAIN
    }
  } as Href
}

export const handleDeeplink = ({
  deeplink,
  dispatch,
  isEarnBlocked,
  isInAppDefiBlocked,
  shouldRedirectStakeCompleteToCct,
  isDeveloperMode,
  shouldShowSwapOnboarding,
  openUrl
}: {
  deeplink: DeepLink
  dispatch: Dispatch
  isEarnBlocked: boolean
  isInAppDefiBlocked: boolean
  /** Fusion + Avalanche CCT flags both on — see `getStakeCompleteHref`. */
  shouldRedirectStakeCompleteToCct: boolean
  isDeveloperMode: boolean
  shouldShowSwapOnboarding: boolean
  openUrl: (history: Pick<History, 'url' | 'title'>) => void
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
        navigateFromDeeplinkUrl(
          getStakeCompleteHref({
            shouldRedirectToCct: shouldRedirectStakeCompleteToCct,
            isDeveloperMode,
            shouldShowSwapOnboarding
          })
        )
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
      } else if (action === 'activity' && !isInAppDefiBlocked) {
        // When in-app DeFi is enabled, Activity is moved to Portfolio sub-tab
        // Redirect activity deeplinks to Portfolio
        navigateFromDeeplinkUrl('/portfolio')
      } else if (action === 'earn' && isInAppDefiBlocked) {
        // When in-app DeFi is disabled, redirect earn deeplinks to stake
        navigateFromDeeplinkUrl('/stake')
      } else {
        const baseUrl = deeplink.url.split('?')[0]?.toLowerCase()
        if (baseUrl && !lowercasedDeeplinkWhitelist.includes(baseUrl)) {
          Logger.error(`${deeplink.url} is not allowed to be opened in the app`)
          return
        }
        const path = deeplink.url.split(':/')[1]
        // @ts-ignore - dynamic path
        path && navigateFromDeeplinkUrl(path)
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
