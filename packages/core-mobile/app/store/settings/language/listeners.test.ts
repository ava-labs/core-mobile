// Inline mocks; read them back through the imports (no outer-var refs).
jest.mock('utils/mmkv/storages', () => ({ commonStorage: { set: jest.fn() } }))
jest.mock('i18next', () => ({
  __esModule: true,
  default: { changeLanguage: jest.fn(() => Promise.resolve()) }
}))

import i18n from 'i18next'
import { commonStorage } from 'utils/mmkv/storages'
import { handleLanguageChange } from './listeners'
import { setSelectedLanguage } from './slice'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiWith = (selected: string): any => ({
  getState: () => ({ settings: { language: { selected } } })
})

describe('handleLanguageChange', () => {
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
})
