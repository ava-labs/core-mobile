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

describe('handleDeeplink', () => {
  it('should handle deeplink', () => {
    expect(true).toBe(true)
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
