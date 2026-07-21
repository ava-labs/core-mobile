// Inline mocks; read them back through the imports (no outer-var refs).
jest.mock('utils/mmkv/storages', () => ({ commonStorage: { set: jest.fn() } }))
jest.mock('i18next', () => ({ __esModule: true, default: { changeLanguage: jest.fn() } }))

import i18n from 'i18next'
import { commonStorage } from 'utils/mmkv/storages'
import { handleLanguageChange } from './listeners'
import { setSelectedLanguage } from './slice'

describe('handleLanguageChange', () => {
  it('write-throughs to MMKV and calls i18n.changeLanguage', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleLanguageChange(setSelectedLanguage('de-DE'), {} as any)
    expect(commonStorage.set).toHaveBeenCalledWith('language', 'de-DE')
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de-DE')
  })
})
