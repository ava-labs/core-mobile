// Inline mocks; read them back through the imports (no outer-var refs).
jest.mock('utils/mmkv/storages', () => ({ commonStorage: { set: jest.fn() } }))
// listeners.ts imports onRehydrationComplete from 'store/app', which otherwise
// drags the whole store dependency graph into this unit test. Provide just the
// action creator (real createAction so isAnyOf's .match works).
jest.mock('store/app', () => ({
  onRehydrationComplete: require('@reduxjs/toolkit').createAction(
    'app/onRehydrationComplete'
  )
}))
jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}))
jest.mock('i18next', () => ({
  __esModule: true,
  default: { changeLanguage: jest.fn(() => Promise.resolve()) }
}))

import i18n from 'i18next'
import { commonStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'
import { addLanguageListeners, handleLanguageChange } from './listeners'
import { setSelectedLanguage } from './slice'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiWith = (selected: string): any => ({
  getState: () => ({ settings: { language: { selected } } })
})

const flushMicrotasks = (): Promise<void> =>
  new Promise(resolve => process.nextTick(resolve))

describe('handleLanguageChange', () => {
  beforeEach(() => jest.clearAllMocks())

  it('write-throughs the state code to MMKV and calls i18n.changeLanguage', () => {
    handleLanguageChange(setSelectedLanguage('de-DE'), apiWith('de-DE'))
    expect(commonStorage.set).toHaveBeenCalledWith('language', 'de-DE')
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de-DE')
  })

  it('clamps an unsupported code from state to en-US', () => {
    handleLanguageChange(setSelectedLanguage('xx-XX'), apiWith('xx-XX'))
    expect(commonStorage.set).toHaveBeenCalledWith('language', 'en-US')
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en-US')
  })

  it('logs (does not throw) when changeLanguage rejects, with an errorId tag', async () => {
    const err = new Error('locale load failed')
    ;(i18n.changeLanguage as jest.Mock).mockReturnValueOnce(Promise.reject(err))

    handleLanguageChange(setSelectedLanguage('de-DE'), apiWith('de-DE'))
    await flushMicrotasks() // let the .catch handler run

    expect(Logger.error).toHaveBeenCalledWith(
      expect.stringContaining('changeLanguage(de-DE) failed'),
      err,
      expect.objectContaining({
        errorId: 'i18n_change_language_failed',
        locale: 'de-DE'
      })
    )
  })
})

describe('addLanguageListeners', () => {
  it('registers a listener that fires on both setSelectedLanguage and rehydration', () => {
    const startListening = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addLanguageListeners(startListening as any)

    const registered = startListening.mock.calls[0][0]
    expect(registered.matcher(setSelectedLanguage('de-DE'))).toBe(true)
    // reconcile-on-rehydration (mirrors settings/appearance); matched by type
    expect(registered.matcher({ type: 'app/onRehydrationComplete' })).toBe(true)
    // unrelated actions do not fire it
    expect(registered.matcher({ type: 'some/other' })).toBe(false)
  })
})
