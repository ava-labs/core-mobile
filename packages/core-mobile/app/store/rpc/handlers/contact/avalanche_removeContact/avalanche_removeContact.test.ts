// import { rpcErrors } from '@metamask/rpc-errors'
// import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
// import mockSession from 'tests/fixtures/walletConnect/session.json'
// import mockContacts from 'tests/fixtures/contacts.json'
// import * as Navigation from 'utils/Navigation'
// import { removeContact } from 'store/addressBook'
// import { avalancheRemoveContactHandler as handler } from './avalanche_removeContact'

// jest.mock('store/addressBook', () => {
//   const actual = jest.requireActual('store/addressBook')
//   return {
//     ...actual,
//     selectContacts: () => mockContacts
//   }
// })

// const mockNavigate = jest.fn()
// jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

// const mockDispatch = jest.fn()
// const mockListenerApi = {
//   getState: jest.fn(),
//   dispatch: mockDispatch
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
// } as any

// const testMethod = RpcMethod.AVALANCHE_REMOVE_CONTACT

// const createRequest = (
//   params: unknown
// ): RpcRequest<RpcMethod.AVALANCHE_REMOVE_CONTACT> => {
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

//   const result = await handler.handle(testRequest, mockListenerApi)

//   expect(result).toEqual({
//     success: false,
//     error: rpcErrors.invalidParams('Contact ID is invalid')
//   })
// }

// const testApproveInvalidData = async (data: unknown) => {
//   const testRequest = createRequest([
//     { id: '1aec34f6-308d-4962-ab1b-283504cc0960' }
//   ])

//   const result = await handler.approve(
//     { request: testRequest, data },
//     mockListenerApi
//   )

//   expect(result).toEqual({
//     success: false,
//     error: rpcErrors.internal('Invalid approve data')
//   })
// }

// describe('avalanche_removeContact handler', () => {
//   it('should contain correct methods', () => {
//     expect(handler.methods).toEqual(['avalanche_removeContact'])
//   })

//   describe('handle', () => {
//     it('should return error when params are invalid', async () => {
//       const invalidParamsScenarios = [null, [], [null], [{ id: 2 }]]

//       for (const scenario of invalidParamsScenarios) {
//         await testHandleInvalidParams(scenario)
//       }
//     })

//     it('should return error when requested contact does not exist', async () => {
//       const testRequest = createRequest([{ id: 'someId' }])

//       const result = await handler.handle(testRequest, mockListenerApi)

//       expect(result).toEqual({
//         success: false,
//         error: rpcErrors.resourceNotFound('Contact does not exist')
//       })
//     })

//     it('should display prompt and return success', async () => {
//       const testContactId = '1aec34f6-308d-4962-ab1b-283504cc0960'

//       const testRequest = createRequest([{ id: testContactId }])

//       const result = await handler.handle(testRequest, mockListenerApi)

//       expect(result).toEqual({ success: true, value: expect.any(Symbol) })
//     })
//   })

//   describe('approve', () => {
//     it('should return error when approve data is invalid', async () => {
//       const invalidDataScenarios = [
//         null,
//         {},
//         { contact: null },
//         {
//           contact: {
//             name: 'Bob',
//             address: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
//             addressBTC: 'tb1qjmapax0vtca726g8kaermd5rzdljql66esxs49'
//           }
//         }
//       ]

//       for (const scenario of invalidDataScenarios) {
//         await testApproveInvalidData(scenario)
//       }
//     })

//     it('should remove contact and return success', async () => {
//       const testContactId = '1aec34f6-308d-4962-ab1b-283504cc0960'

//       const testContact = {
//         id: '1aec34f6-308d-4962-ab1b-283504cc0960',
//         name: 'Bob',
//         addressBTC: 'tb1qjmapax0vtca726g8kaermd5rzdljql66esxs49',
//         address: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
//       }

//       const testRequest = createRequest([{ id: testContactId }])

//       const result = await handler.approve(
//         { request: testRequest, data: { contact: testContact } },
//         mockListenerApi
//       )

//       expect(mockDispatch).toHaveBeenCalledWith(removeContact(testContactId))

//       expect(result).toEqual({ success: true, value: [] })
//     })
//   })
// })
