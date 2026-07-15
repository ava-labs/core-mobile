// import crypto from 'crypto'
// import * as Toast from 'utils/toast'
// import * as navigationUtils from 'navigation/utils'
// import { DeepLink } from '../types'
// import { handleDeeplink } from './handleDeeplink'

// const mockShowTransactionSuccessToast = jest.fn()
// const mockShowTransactionErrorToast = jest.fn()
// const mockDispatch = jest.fn()
// const mockNavigateToClaimRewards = jest.fn()
// const mockNavigateToChainPortfolio = jest.fn()
// const mockNavigateToWatchlist = jest.fn()
// const mockOpenUrl = jest.fn()

// jest
//   .spyOn(Toast, 'showTransactionSuccessToast')
//   .mockImplementation(mockShowTransactionSuccessToast)
// jest
//   .spyOn(Toast, 'showTransactionErrorToast')
//   .mockImplementation(mockShowTransactionErrorToast)

// jest
//   .spyOn(navigationUtils, 'navigateToClaimRewards')
//   .mockImplementation(mockNavigateToClaimRewards)

// jest
//   .spyOn(navigationUtils, 'navigateToChainPortfolio')
//   .mockImplementation(mockNavigateToChainPortfolio)

// jest
//   .spyOn(navigationUtils, 'navigateToWatchlist')
//   .mockImplementation(mockNavigateToWatchlist)

import * as navigateFromDeeplink from 'utils/navigateFromDeeplink'
import { DeepLink, DeepLinkOrigin } from '../types'
import { handleDeeplink } from './handleDeeplink'

const mockNavigate = jest
  .spyOn(navigateFromDeeplink, 'navigateFromDeeplinkUrl')
  .mockImplementation(jest.fn())

const stakeCompleteDeeplink = {
  url: 'core://stakecomplete',
  origin: DeepLinkOrigin.ORIGIN_NOTIFICATION
} as DeepLink

const baseArgs = {
  deeplink: stakeCompleteDeeplink,
  dispatch: jest.fn(),
  isEarnBlocked: false,
  isInAppDefiBlocked: false,
  shouldRedirectStakeCompleteToCct: true,
  isDeveloperMode: false,
  shouldShowSwapOnboarding: false,
  openUrl: jest.fn()
}

describe('handleDeeplink — stakecomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to the CCT swap prefilled with the P → C AVAX pair', () => {
    handleDeeplink(baseArgs)
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/swap/swap',
      params: {
        initialTokenIdFrom: 'NATIVE-avax',
        initialFromCaip2Id: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
        initialTokenIdTo: 'NATIVE-avax',
        initialToCaip2Id: 'eip155:43114'
      }
    })
  })

  it('routes through the swap onboarding for first-time swappers', () => {
    handleDeeplink({ ...baseArgs, shouldShowSwapOnboarding: true })
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/swap/onboarding' })
    )
  })

  it('uses the Fuji P-Chain and C-Chain ids in developer mode', () => {
    handleDeeplink({ ...baseArgs, isDeveloperMode: true })
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          initialFromCaip2Id: 'avax:Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG',
          initialToCaip2Id: 'eip155:43113'
        })
      })
    )
  })

  it('falls back to the legacy claim screen while CCT is unavailable', () => {
    handleDeeplink({ ...baseArgs, shouldRedirectStakeCompleteToCct: false })
    expect(mockNavigate).toHaveBeenCalledWith('/claimStakeReward')
  })

  it('does nothing when earn is blocked', () => {
    handleDeeplink({ ...baseArgs, isEarnBlocked: true })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
// describe('handleDeeplink', () => {
//   describe('handle walletConnect urls', () => {
//     it('should parse https link correctly', () => {
//       const mockDeeplink = {
//         url: 'https://core.app/wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockDispatch).toHaveBeenCalledWith({
//         payload:
//           'wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb',
//         type: 'walletConnectV2/newSession'
//       })
//     })

//     it('should parse wc link correctly', () => {
//       const mockDeeplink = {
//         url: 'wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockDispatch).toHaveBeenCalledWith({
//         payload:
//           'wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb',
//         type: 'walletConnectV2/newSession'
//       })
//     })

//     it('should parse core link correctly', () => {
//       const mockDeeplink = {
//         url: 'core://wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockDispatch).toHaveBeenCalledWith({
//         payload:
//           'wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb',
//         type: 'walletConnectV2/newSession'
//       })
//     })

//     it('should ignore http url', () => {
//       const mockDeeplink = {
//         url: 'http://core.app/wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockDispatch).not.toHaveBeenCalled()
//     })

//     it('should ignore url with random string', () => {
//       const randomString = crypto.randomBytes(16).toString('hex')
//       const mockDeeplink = {
//         url: randomString
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockDispatch).not.toHaveBeenCalled()
//     })
//   })

//   describe('handle https urls', () => {
//     it('should open https link', () => {
//       const mockDeeplink = {
//         url: 'https://www.avax.network/blog'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockOpenUrl).toHaveBeenCalledWith(mockDeeplink.url)
//     })

//     it('should ignore http link', () => {
//       const mockDeeplink = {
//         url: 'http://www.avax.network/blog'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockOpenUrl).not.toHaveBeenCalled()
//     })

//     it('should ignore url with random string', () => {
//       const randomString = crypto.randomBytes(16).toString('hex')
//       const mockDeeplink = {
//         url: randomString
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockOpenUrl).not.toHaveBeenCalled()
//     })
//   })

//   describe('handle stakecomplete deeplink', () => {
//     it('should navigate to claim reward', () => {
//       const mockDeeplink = {
//         url: 'core://stakecomplete'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockNavigateToClaimRewards).toHaveBeenCalled()
//     })

//     it('should not navigate to claim reward when earn flag is blocked', () => {
//       const mockDeeplink = {
//         url: 'core://stakecomplet'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: true,
//         openUrl: mockOpenUrl
//       })
//       expect(mockNavigateToClaimRewards).not.toHaveBeenCalled()
//     })
//   })

//   describe('handle portfolio deeplink', () => {
//     it('should navigate to portfolio', () => {
//       const mockDeeplink = {
//         url: 'core://portfolio'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockNavigateToChainPortfolio).toHaveBeenCalled()
//     })
//   })

//   describe('handle watchlist deeplink', () => {
//     it('should navigate to watchlist', () => {
//       const mockDeeplink = {
//         url: 'core://watchlist'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockNavigateToWatchlist).toHaveBeenCalledWith(undefined)
//     })

//     it('should navigate to a watchlist token', () => {
//       const mockDeeplink = {
//         url: 'core://watchlist/avalanche-2'
//       }
//       handleDeeplink({
//         deeplink: mockDeeplink as DeepLink,
//         dispatch: mockDispatch,
//         isEarnBlocked: false,
//         openUrl: mockOpenUrl
//       })
//       expect(mockNavigateToWatchlist).toHaveBeenCalledWith('avalanche-2')
//     })
//   })
// })
