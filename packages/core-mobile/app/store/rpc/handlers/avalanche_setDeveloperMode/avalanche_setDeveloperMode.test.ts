// TODO rework this rpc
// import { RpcMethod, RpcProvider } from 'store/rpc/types'
// import mockSession from 'tests/fixtures/walletConnect/session.json'
// import { rpcErrors } from '@metamask/rpc-errors'
// import { DEFERRED_RESULT } from '../types'
// import { avalancheSetDeveloperModeHandler } from './avalanche_setDeveloperMode'
// import { AvalancheSetDeveloperModeRpcRequest } from './types'

// const mockNavigate = jest.fn()
// jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)
// jest.mock('../index')

// const createRequest = (
//   params: unknown
// ): AvalancheSetDeveloperModeRpcRequest => {
//   return {
//     provider: RpcProvider.WALLET_CONNECT,
//     method: RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
//     data: {
//       id: 1,
//       topic: '1',
//       params: {
//         request: {
//           method: RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
//           params
//         },
//         chainId: 'eip155:43114'
//       }
//     },
//     peerMeta: mockSession.peer.metadata
//   }
// }

// describe('avalanche_setDeveloperMode.ts', () => {
//   describe('handle', () => {
//     it('returns error if param is not boolean', async () => {
//       const mockListenerApi = {
//         getState: () => ({
//           settings: { advanced: { developerMode: false } }
//         }),
//         dispatch: jest.fn()
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       } as any
//       const request = createRequest('1')
//       const result = await avalancheSetDeveloperModeHandler.handle(
//         request,
//         mockListenerApi
//       )
//       expect(result).toEqual({
//         success: false,
//         error: rpcErrors.invalidParams(
//           'avalanche_setDeveloperMode param is invalid'
//         )
//       })
//       expect(mockNavigate).not.toHaveBeenCalled()
//     })
//     it('returns false if param is same as current developer mode', async () => {
//       const mockListenerApi = {
//         getState: () => ({
//           settings: { advanced: { developerMode: true } }
//         }),
//         dispatch: jest.fn()
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       } as any
//       const request = createRequest([true])
//       const result = await avalancheSetDeveloperModeHandler.handle(
//         request,
//         mockListenerApi
//       )
//       expect(result).toEqual({
//         success: true,
//         value: null
//       })
//     })
//     it('returns true if param is different from the current deveoper mode', async () => {
//       const mockListenerApi = {
//         getState: () => ({
//           settings: { advanced: { developerMode: false } }
//         }),
//         dispatch: jest.fn()
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       } as any
//       const request = createRequest([true])
//       const result = await avalancheSetDeveloperModeHandler.handle(
//         request,
//         mockListenerApi
//       )
//       expect(result).toEqual({
//         success: true,
//         value: DEFERRED_RESULT
//       })
//       expect(mockNavigate).toHaveBeenCalledWith({
//         name: 'Root.Wallet',
//         params: {
//           screen: 'ModalScreens.AvalancheSetDeveloperMode',
//           params: { request, data: { enabled: true } }
//         }
//       })
//     })

//     describe('approve', () => {
//       it('should update developer mode and return message developer mode is set to true', async () => {
//         const mockListenerApi = {
//           getState: () => ({
//             settings: { advanced: { developerMode: false } }
//           }),
//           dispatch: jest.fn()
//           // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         } as any
//         const request = createRequest([true])
//         const result = await avalancheSetDeveloperModeHandler.approve(
//           {
//             request,
//             data: { enabled: true }
//           },
//           mockListenerApi
//         )
//         expect(result).toEqual({
//           success: true,
//           value: 'Developer Mode set to true'
//         })
//       })
//     })
//   })
// })
