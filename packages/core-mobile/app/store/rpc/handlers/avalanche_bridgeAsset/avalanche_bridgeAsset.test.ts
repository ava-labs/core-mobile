// TODO: fix bridgeAsset
// import { rpcErrors } from '@metamask/rpc-errors'
// import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
// import mockSession from 'tests/fixtures/walletConnect/session.json'
// import mockAccounts from 'tests/fixtures/accounts.json'
// import mockNetworks from 'tests/fixtures/networks.json'
// import mockBridgeConfig from 'tests/fixtures/bridgeConfig'
// import AppNavigation from 'navigation/AppNavigation'
// import * as Navigation from 'utils/Navigation'
// import BridgeService from 'services/bridge/BridgeService'
// import * as Sentry from '@sentry/react-native'
// import {
//   BitcoinDynamicFeeConfigAsset,
//   BitcoinStaticFeeConfigAsset,
//   Blockchain,
//   EthereumDynamicFeeAssetConfig,
//   EthereumStaticFeeAssetConfig
// } from '@avalabs/core-bridge-sdk'
// import { avalancheBridgeAssetHandler as handler } from './avalanche_bridgeAsset'

// const mockNoop = jest.fn()
// jest.mock('@avalabs/core-utils-sdk', () => {
//   const actual = jest.requireActual('@avalabs/core-utils-sdk')
//   return {
//     ...actual,
//     noop: mockNoop
//   }
// })

// const mockRequest = jest.fn()
// jest.mock('store/rpc/utils/createInAppRequest', () => ({
//   createInAppRequest: () => mockRequest
// }))

// const mockActiveAccount = mockAccounts[0]
// jest.mock('store/account/slice', () => {
//   const actual = jest.requireActual('store/account/slice')
//   return {
//     ...actual,
//     selectActiveAccount: () => mockActiveAccount
//   }
// })

// jest.mock('store/network/slice', () => {
//   const actual = jest.requireActual('store/network/slice')
//   return {
//     ...actual,
//     selectNetworks: () => mockNetworks,
//     selectActiveNetwork: () => mockNetworks[43114]
//   }
// })

// const mockIsDeveloperMode = true
// jest.mock('store/settings/advanced/slice', () => {
//   const actual = jest.requireActual('store/settings/advanced/slice')
//   return {
//     ...actual,
//     selectIsDeveloperMode: () => mockIsDeveloperMode
//   }
// })

// jest.mock('store/bridge/slice', () => {
//   const actual = jest.requireActual('store/bridge/slice')
//   return {
//     ...actual,
//     selectBridgeAppConfig: () => mockBridgeConfig
//   }
// })

// const mockTxHash = '0x123323'
// const mockTransferEVMAsset = jest.fn()
// const mockTransferBTCAsset = jest.fn()

// jest
//   .spyOn(BridgeService, 'transferEVM')
//   .mockImplementation(mockTransferEVMAsset)
// jest
//   .spyOn(BridgeService, 'transferBTC')
//   .mockImplementation(mockTransferBTCAsset)

// mockTransferEVMAsset.mockResolvedValue(mockTxHash)
// mockTransferBTCAsset.mockResolvedValue(mockTxHash)

// const mockCaptureException = jest.fn()
// jest.spyOn(Sentry, 'captureException').mockImplementation(mockCaptureException)

// const mockNavigate = jest.fn()
// jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

// const mockDispatch = jest.fn()
// const mockListenerApi = {
//   getState: jest.fn(),
//   dispatch: mockDispatch
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// } as any

// const testMethod = RpcMethod.AVALANCHE_BRIDGE_ASSET

// const testNativeAsset = {
//   assetType: 1,
//   avaxPromotionAmount: '100000000000000000',
//   avaxPromotionDollarThreshold: 1,
//   denomination: 18,
//   nativeContractAddress: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
//   nativeNetwork: 'ethereum',
//   offboardFeeDollars: 1,
//   offboardFeeProcessThreshold: '1000000000000000000',
//   symbol: 'WETH',
//   tokenName: 'Wrapped Ether',
//   wrappedContractAddress: '0x678c4c42572ec1c44b144c5a6712b69d2a5d412c',
//   wrappedNetwork: 'avalanche'
// }

// const testBtcStaticFeeAsset: BitcoinStaticFeeConfigAsset = {
//   assetType: 2,
//   additionalTxFeeAmount: 0.0001,
//   avaxPromotionAmount: '100000000000000000',
//   avaxPromotionDollarThreshold: 1,
//   bech32AddressPrefix: 'bc',
//   offboardFeeDollars: 1,
//   onboardFeeDollars: 1,
//   operatorAddress: '0x',
//   privateKeyPrefix: '0x',
//   reserveBalanceHighWaterMark: 0.1,
//   reserveBalanceLowWaterMark: 0.01,
//   targetChangeAmount: 0.001,
//   wrappedContractAddress: '0x678c4c425',
//   wrappedNetwork: 'avalanche',
//   symbol: 'BTC',
//   tokenName: 'Bitcoin',
//   nativeNetwork: Blockchain.BITCOIN,
//   denomination: 8
// }

// const testBtcDynamicFeeAsset: BitcoinDynamicFeeConfigAsset = {
//   assetType: 2,
//   additionalTxFeeAmount: 0.0001,
//   avaxPromotionAmount: '100000000000000000',
//   avaxPromotionDollarThreshold: 1,
//   bech32AddressPrefix: 'bc',
//   operatorAddress: '0x',
//   privateKeyPrefix: '0x',
//   reserveBalanceHighWaterMark: 0.1,
//   reserveBalanceLowWaterMark: 0.01,
//   targetChangeAmount: 0.001,
//   wrappedContractAddress: '0x678c4c425',
//   wrappedNetwork: 'avalanche',
//   offboardFeeConfiguration: {
//     feePercentage: 1,
//     feePercentageDecimals: 2,
//     maximumFeeDollars: 100,
//     minimumFeeDollars: 1
//   },
//   onboardFeeConfiguration: {
//     feePercentage: 1,
//     feePercentageDecimals: 2,
//     maximumFeeDollars: 100,
//     minimumFeeDollars: 1
//   },
//   symbol: 'BTC',
//   tokenName: 'Bitcoin',
//   nativeNetwork: Blockchain.BITCOIN,
//   denomination: 8
// }

// const testEthStaticFeeAsset: EthereumStaticFeeAssetConfig = {
//   assetType: 1,
//   avaxPromotionAmount: '100000000000000000',
//   avaxPromotionDollarThreshold: 1,
//   chainlinkFeedAddress: '0x',
//   maximumOnboardFee: '1000000000000000000',
//   nativeContractAddress: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
//   offboardFeeDollars: 1,
//   offboardFeeProcessThreshold: '1000000000000000000',
//   onboardFeePercentage: '1',
//   wrappedContractAddress: '0x678c4c425',
//   wrappedNetwork: 'avalanche',
//   deprecatedTokenContractAddress: '0x1234567890',
//   symbol: 'WETH',
//   tokenName: 'Wrapped Ether',
//   nativeNetwork: Blockchain.ETHEREUM,
//   denomination: 18
// }

// const testEthDynamicFeeAsset: EthereumDynamicFeeAssetConfig = {
//   assetType: 1,
//   avaxPromotionAmount: '100000000000000000',
//   avaxPromotionDollarThreshold: 1,
//   chainlinkFeedAddress: '0x',
//   chainlinkFeedNetwork: 'ethereum',
//   ipfsHash: 'QmQmQm',
//   transferGasLimit: 100000,
//   nativeContractAddress: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
//   wrappedContractAddress: '0x678c4c425',
//   wrappedNetwork: 'avalanche',
//   deprecatedTokenContractAddress: '0x1234567890',
//   offboardFeeProcessThreshold: '1000000000000000000',
//   offboardFeeConfiguration: {
//     feePercentage: 1,
//     feePercentageDecimals: 2,
//     maximumFeeDollars: 100,
//     minimumFeeDollars: 1
//   },
//   onboardFeeConfiguration: {
//     feePercentage: 1,
//     feePercentageDecimals: 2,
//     maximumFeeDollars: 100,
//     minimumFeeDollars: 1
//   },
//   symbol: 'WETH',
//   tokenName: 'Wrapped Ether',
//   nativeNetwork: Blockchain.ETHEREUM,
//   denomination: 18
// }
// const testParams = ['avalanche', '0.01', testNativeAsset]
// const testEthDynamicFeeParams = ['ethereum', '0.01', testEthDynamicFeeAsset]
// const testEthStaticFeeParams = ['ethereum', '0.01', testEthStaticFeeAsset]
// const testBtcDynamicFeeParams = ['bitcoin', '0.01', testBtcDynamicFeeAsset]
// const testBtcStaticFeeParams = ['bitcoin', '0.01', testBtcStaticFeeAsset]

// const createRequest = (
//   params: unknown
// ): RpcRequest<RpcMethod.AVALANCHE_BRIDGE_ASSET> => {
//   return {
//     provider: RpcProvider.WALLET_CONNECT,
//     method: testMethod,
//     data: {
//       id: 1677366383831712,
//       topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
//       params: {
//         request: {
//           method: testMethod,
//           params
//         },
//         chainId: 'eip155:43113'
//       }
//     },
//     peerMeta: mockSession.peer.metadata
//   }
// }

// const testHandleInvalidParams = async (params: unknown) => {
//   const testRequest = createRequest(params)

//   const result = await handler.handle(testRequest)

//   expect(result).toEqual({
//     success: false,
//     error: rpcErrors.invalidParams('Params are invalid')
//   })
// }

// const testHandleValidParams = async (params: unknown) => {
//   const testRequest = createRequest(params)

//   const result = await handler.handle(testRequest)

//   expect(mockNavigate).toHaveBeenCalledWith({
//     name: AppNavigation.Root.Wallet,
//     params: {
//       screen: AppNavigation.Modal.BridgeAssetV2,
//       params: {
//         request: testRequest,
//         amountStr: expect.any(String),
//         asset: expect.any(Object),
//         currentBlockchain: expect.any(String)
//       }
//     }
//   })

//   expect(result).toEqual({ success: true, value: expect.any(Symbol) })
// }

// const testApproveInvalidData = async (data: unknown) => {
//   const testRequest = createRequest(testParams)

//   const result = await handler.approve(
//     { request: testRequest, data },
//     mockListenerApi
//   )

//   expect(result).toEqual({
//     success: false,
//     error: rpcErrors.internal('Invalid approve data')
//   })
// }

// describe('avalanche_bridgeAsset handler', () => {
//   it('should contain correct methods', () => {
//     expect(handler.methods).toEqual(['avalanche_bridgeAsset'])
//   })

//   describe('handle', () => {
//     it('should return error when params are invalid', async () => {
//       const invalidParamsScenarios = [
//         null,
//         [],
//         [null],
//         ['avalanche'],
//         ['avalanche', '0.01'],
//         [testNativeAsset]
//       ]

//       for (const scenario of invalidParamsScenarios) {
//         await testHandleInvalidParams(scenario)
//       }
//     })

//     it('should display prompt and return success', async () => {
//       const testRequest = createRequest(testParams)

//       const result = await handler.handle(testRequest)

//       expect(mockNavigate).toHaveBeenCalledWith({
//         name: AppNavigation.Root.Wallet,
//         params: {
//           screen: AppNavigation.Modal.BridgeAssetV2,
//           params: {
//             request: testRequest,
//             amountStr: '0.01',
//             asset: testNativeAsset,
//             currentBlockchain: 'avalanche'
//           }
//         }
//       })

//       expect(result).toEqual({ success: true, value: expect.any(Symbol) })
//     })

//     it('should display prompt and return success for differnet asset types', async () => {
//       const validParamsScenarios = [
//         testParams,
//         testEthDynamicFeeParams,
//         testEthStaticFeeParams,
//         testBtcDynamicFeeParams,
//         testBtcStaticFeeParams
//       ]

//       for (const scenario of validParamsScenarios) {
//         await testHandleValidParams(scenario)
//       }
//     })
//   })

//   describe('approve', () => {
//     it('should return error when approve data is invalid', async () => {
//       const invalidDataScenarios = [
//         null,
//         {},
//         { amountStr: '0.01' },
//         { asset: testNativeAsset },
//         { currentBlockchain: 'avalanche' }
//       ]

//       for (const scenario of invalidDataScenarios) {
//         await testApproveInvalidData(scenario)
//       }
//     })

//     it('should transfer asset and return success with transaction', async () => {
//       const testRequest = createRequest(testParams)

//       const result = await handler.approve(
//         {
//           request: testRequest,
//           data: {
//             amountStr: '0.01',
//             asset: testNativeAsset,
//             currentBlockchain: 'avalanche',
//             maxFeePerGas: 100n
//           }
//         },
//         mockListenerApi
//       )

//       expect(mockTransferEVMAsset).toHaveBeenCalledWith({
//         currentBlockchain: 'avalanche',
//         amount: '0.01',
//         asset: testNativeAsset,
//         config: mockBridgeConfig,
//         activeAccount: mockActiveAccount,
//         allNetworks: mockNetworks,
//         isTestnet: mockIsDeveloperMode,
//         onStatusChange: undefined,
//         onTxHashChange: undefined,
//         request: mockRequest
//       })

//       expect(result).toEqual({ success: true, value: { hash: mockTxHash } })
//     })

//     it('should transfer btc asset and return success with transaction', async () => {
//       const testRequest = createRequest(testBtcDynamicFeeParams)

//       const result = await handler.approve(
//         {
//           request: testRequest,
//           data: {
//             amountStr: '0.01',
//             asset: testBtcDynamicFeeAsset,
//             currentBlockchain: 'bitcoin',
//             maxFeePerGas: 100n
//           }
//         },
//         mockListenerApi
//       )

//       expect(mockTransferBTCAsset).toHaveBeenCalled()
//       expect(result).toEqual({ success: true, value: { hash: mockTxHash } })
//     })

//     it('should return error when failed to transfer asset', async () => {
//       const testError = Error('test error')
//       mockTransferEVMAsset.mockImplementationOnce(() => {
//         throw testError
//       })

//       const testRequest = createRequest(testParams)

//       const result = await handler.approve(
//         {
//           request: testRequest,
//           data: {
//             amountStr: '0.01',
//             asset: testNativeAsset,
//             currentBlockchain: 'avalanche',
//             maxFeePerGas: 100n
//           }
//         },
//         mockListenerApi
//       )

//       expect(mockTransferEVMAsset).toHaveBeenCalledWith({
//         currentBlockchain: 'avalanche',
//         amount: '0.01',
//         asset: testNativeAsset,
//         config: mockBridgeConfig,
//         activeAccount: mockActiveAccount,
//         allNetworks: mockNetworks,
//         isTestnet: mockIsDeveloperMode,
//         onStatusChange: undefined,
//         onTxHashChange: undefined,
//         request: mockRequest
//       })

//       expect(mockCaptureException).toHaveBeenCalledWith(testError, {
//         tags: { dapps: 'bridgeAssetV2' }
//       })

//       expect(result).toEqual({
//         success: false,
//         error: rpcErrors.internal('Unable to transfer asset')
//       })
//     })
//   })
// })
