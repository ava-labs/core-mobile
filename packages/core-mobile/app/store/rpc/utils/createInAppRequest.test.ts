import { Dispatch } from '@reduxjs/toolkit'
import { RpcMethod as VmModuleRpcMethod } from '@avalabs/vm-module-types'
import { FeatureVars } from 'services/posthog/types'
import { RootState } from 'store/types'
import { RequestContext } from '../types'
import { createInAppRequest } from './createInAppRequest'
import { generateInAppRequestPayload } from './generateInAppRequestPayload'

jest.mock('store/middleware/listener', () => ({
  addAppListener: jest.fn(() => ({ type: 'addListener' }))
}))

jest.mock('../slice', () => ({
  onRequest: jest.fn(payload => ({ type: 'rpc/onRequest', payload })),
  onInAppRequestSucceeded: { match: jest.fn(() => false) },
  onInAppRequestFailed: { match: jest.fn(() => false) }
}))

jest.mock('./generateInAppRequestPayload', () => ({
  generateInAppRequestPayload: jest.fn(() => ({
    type: 'rpc/onRequest',
    payload: { requestId: 'req-1' },
    data: { id: 'req-1' }
  }))
}))

const mockGenerateInAppRequestPayload = generateInAppRequestPayload as jest.Mock

const makeState = (saeOverride?: string): RootState =>
  ({
    posthog: {
      featureFlags: saeOverride
        ? { [FeatureVars.SAE_OVERRIDE]: saeOverride }
        : {}
    }
  } as unknown as RootState)

describe('createInAppRequest', () => {
  let dispatch: jest.MockedFunction<Dispatch>

  beforeEach(() => {
    jest.clearAllMocks()
    dispatch = jest.fn() as unknown as jest.MockedFunction<Dispatch>
  })

  it('snapshots the sae-override flag into request.context when set', () => {
    const getState = (): RootState => makeState('enabled')
    const request = createInAppRequest(dispatch, getState)

    request({
      method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
      params: [],
      chainId: 'eip155:43114',
      context: { existing: 'value' }
    })

    expect(mockGenerateInAppRequestPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          existing: 'value',
          [RequestContext.SAE_OVERRIDE]: 'enabled'
        }
      })
    )
  })

  it("defaults the sae-override key to 'auto' when the flag is unset", () => {
    const getState = (): RootState => makeState(undefined)
    const request = createInAppRequest(dispatch, getState)

    request({
      method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
      params: [],
      chainId: 'eip155:43114'
    })

    expect(mockGenerateInAppRequestPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { [RequestContext.SAE_OVERRIDE]: 'auto' }
      })
    )
  })

  it('reads the flag at request creation time, not at module load time', () => {
    let currentOverride: string | undefined = 'disabled'
    const getState = (): RootState => makeState(currentOverride)
    const request = createInAppRequest(dispatch, getState)

    currentOverride = 'enabled'

    request({
      method: VmModuleRpcMethod.ETH_SEND_TRANSACTION,
      params: [],
      chainId: 'eip155:43114'
    })

    expect(mockGenerateInAppRequestPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { [RequestContext.SAE_OVERRIDE]: 'enabled' }
      })
    )
  })
})
