import {
  ActionCreator,
  configureStore,
  createListenerMiddleware
} from '@reduxjs/toolkit'
import { noop } from 'lodash'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import BridgeService from 'services/bridge/BridgeService'
import { toggleDeveloperMode } from 'store/settings/advanced'
import testConfig from 'tests/fixtures/bridgeConfig'
import { BridgeConfig } from '@avalabs/bridge-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { addBridgeListeners } from './listeners'
import { bridgeReducer, reducerName, selectBridgeConfig } from './slice'

// mocks
const getBridgeConfig = BridgeService.getConfig as jest.Mock<
  ReturnType<typeof BridgeService.getConfig>
>

jest.mock('store/network', () => {
  const actual = jest.requireActual('store/network')
  return {
    selectActiveNetwork: jest.fn().mockReturnValue(actual.defaultNetwork)
  }
})

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
const testStartOnAction = (action: ActionCreator<any>) => {
  // given there is no bridge config saved yet
  expect(selectBridgeConfig(getState(store))).toBe(undefined)

  // when specified action is dispatched
  store.dispatch(action())

  // fast forward and exhaust only currently pending timers
  jest.runOnlyPendingTimers()

  // then the bridge config is saved
  expect(selectBridgeConfig(getState(store))).toBe(testConfig)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testStopOnAction = (action: ActionCreator<any>) => {
  testStartOnAction(onAppUnlocked)

  // mock new server response
  const newTestConfig1 = createBridgeConfig('v1')
  getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig1))

  // wait for 15 seconds
  jest.advanceTimersByTime(15000)

  // make sure we saved the new response
  expect(selectBridgeConfig(getState(store))).toBe(newTestConfig1)

  // mock new server response again
  const newTestConfig2 = createBridgeConfig('v2')
  getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig2))

  // when specified action is dispatched
  store.dispatch(action())

  // wait for 15 seconds
  jest.advanceTimersByTime(15000)

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
    it('should start on developer mode changed', () => {
      testStartOnAction(toggleDeveloperMode)
    })

    it('should start on app unlocked', () => {
      testStartOnAction(onAppUnlocked)
    })

    it('should fetch new config every 15 seconds', () => {
      testStartOnAction(onAppUnlocked)

      for (let i = 0; i < 2; i++) {
        // mock new server response
        const newTestConfig = createBridgeConfig(`v${i + 1}`)
        getBridgeConfig.mockReturnValueOnce(Promise.resolve(newTestConfig))

        // wait for 15 seconds
        jest.advanceTimersByTime(15000)

        // make sure we saved the new response
        expect(selectBridgeConfig(getState(store))).toBe(newTestConfig)
      }
    })

    it('should stop on log out', () => {
      testStopOnAction(onLogOut)
    })

    it('should stop on app locked', () => {
      testStopOnAction(onAppLocked)
    })

    it('should have only 1 active instance at any time', () => {
      // given there is no bridge config saved yet
      expect(selectBridgeConfig(getState(store))).toBe(undefined)

      // when developer mode is toggled twice
      store.dispatch(toggleDeveloperMode())
      store.dispatch(toggleDeveloperMode())

      // fast forward and exhaust only currently pending timers
      jest.runOnlyPendingTimers()

      // then we only fetch bridge config once (as supposed to twice)
      expect(getBridgeConfig).toHaveBeenCalledTimes(1)

      // and the bridge config is saved
      expect(selectBridgeConfig(getState(store))).toBe(testConfig)
    })
  })
})
