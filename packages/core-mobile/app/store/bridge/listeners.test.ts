import { InteractionManager } from 'react-native'
import {
  ActionCreator,
  configureStore,
  createListenerMiddleware
} from '@reduxjs/toolkit'
import { noop } from 'lodash'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { AppStartListening } from 'store/types'
import BridgeService from 'services/bridge/BridgeService'
import { toggleDeveloperMode } from 'store/settings/advanced'
import testConfig from 'tests/fixtures/bridgeConfig'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { addBridgeListeners } from './listeners'
import { bridgeReducer, reducerName, selectBridgeConfig } from './slice'

beforeAll(() => {
  jest
    .spyOn(InteractionManager, 'runAfterInteractions')
    // @ts-ignore
    .mockImplementation(cb => {
      // @ts-ignore
      cb() // run immediately
      return { cancel: jest.fn() }
    })
})

// mocks
const getBridgeConfig = BridgeService.getConfig as jest.Mock<
  ReturnType<typeof BridgeService.getConfig>
>

jest.mock('services/bridge/BridgeService')

jest.useFakeTimers()

// store utils
const listenerMiddlewareInstance = createListenerMiddleware({
  onError: jest.fn(noop)
})

const setupTestStore = () => {
  return configureStore({
    reducer: {
      [reducerName]: bridgeReducer
    },
    middleware: gDM => gDM().prepend(listenerMiddlewareInstance.middleware)
  })
}

let store: ReturnType<typeof setupTestStore>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getState: any = (storeInstance: typeof store) => storeInstance.getState()

// common tests
const createBridgeConfig = (version: string): BridgeConfig => {
  assertNotUndefined(testConfig.config)
  return {
    ...testConfig,
    config: {
      ...testConfig.config,
      version
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testStartOnAction = async (action: ActionCreator<any>) => {
  // given there is no bridge config saved yet
  expect(selectBridgeConfig(getState(store))).toBe(undefined)

  // when specified action is dispatched
  store.dispatch(action())

  // fast forward and exhaust only currently pending timers
  await jest.runOnlyPendingTimersAsync()

  // then the bridge config is saved
  expect(selectBridgeConfig(getState(store))).toBe(testConfig)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testStopOnAction = async (action: ActionCreator<any>) => {
  await testStartOnAction(onAppUnlocked)

  // mock new server response
  const newTestConfig1 = createBridgeConfig('v1')
  getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig1))

  // wait for 15 seconds
  await jest.advanceTimersByTimeAsync(15000)

  // make sure we saved the new response
  expect(selectBridgeConfig(getState(store))).toBe(newTestConfig1)

  // mock new server response again
  const newTestConfig2 = createBridgeConfig('v2')
  getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig2))

  // when specified action is dispatched
  store.dispatch(action())

  // wait for 15 seconds
  await jest.advanceTimersByTimeAsync(15000)

  // make sure we didn't save the new response
  expect(selectBridgeConfig(getState(store))).toBe(newTestConfig1)

  // reset server response
  getBridgeConfig.mockReset()
}

describe('bridge - listeners', () => {
  beforeEach(() => {
    // set default bridge config that server returns
    getBridgeConfig.mockReturnValue(Promise.resolve(testConfig))

    // reset store and stop all active listeners
    listenerMiddlewareInstance.clearListeners()
    store = setupTestStore()

    // add listeners
    addBridgeListeners(
      listenerMiddlewareInstance.startListening as AppStartListening
    )
  })

  describe('fetchConfigPeriodically', () => {
    it('should start on developer mode changed', async () => {
      await testStartOnAction(toggleDeveloperMode)
    })

    it('should start on app unlocked', async () => {
      await testStartOnAction(onAppUnlocked)
    })

    it('should fetch new config every 15 seconds', async () => {
      await testStartOnAction(onAppUnlocked)

      for (let i = 0; i < 2; i++) {
        // mock new server response
        const newTestConfig = createBridgeConfig(`v${i + 1}`)
        getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig))

        // wait for 15 seconds
        await jest.advanceTimersByTimeAsync(15000)

        // make sure we saved the new response
        expect(selectBridgeConfig(getState(store))).toBe(newTestConfig)
      }
    })

    it('should stop on log out', async () => {
      await testStopOnAction(onLogOut)
    })

    it('should stop on app locked', async () => {
      await testStopOnAction(onAppLocked)
    })

    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should have only 1 active instance at any time', async () => {
      // given there is no bridge config saved yet
      expect(selectBridgeConfig(getState(store))).toBe(undefined)

      // when developer mode is toggled twice
      store.dispatch(toggleDeveloperMode())
      store.dispatch(toggleDeveloperMode())

      // fast forward and exhaust only currently pending timers
      await jest.runOnlyPendingTimersAsync()

      // then we only fetch bridge config once (as supposed to twice)
      expect(getBridgeConfig).toHaveBeenCalledTimes(1)

      // and the bridge config is saved
      expect(selectBridgeConfig(getState(store))).toBe(testConfig)
    })
  })
})
