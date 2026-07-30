// Repo uses react-test-renderer directly (no @testing-library/react-native).
jest.mock('utils/mmkv/storages', () => ({
  commonStorage: { getString: jest.fn(), set: jest.fn() }
}))

import React from 'react'
import { Text } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import i18n from 'i18next'
import { useTranslation } from 'react-i18next'
import { commonStorage } from 'utils/mmkv/storages'
import { initI18n } from './index'

const Sample = (): JSX.Element => {
  const { t } = useTranslation()
  return <Text>{t('Settings')}</Text>
}

const textOf = (tree: renderer.ReactTestRenderer): unknown =>
  tree.root.findByType(Text).props.children

describe('language switch', () => {
  it('re-renders in place when the language changes (backend-loaded locale)', async () => {
    ;(commonStorage.getString as jest.Mock).mockReturnValue('en-US')
    await initI18n()

    let tree!: renderer.ReactTestRenderer
    await act(async () => {
      tree = renderer.create(<Sample />)
    })
    expect(textOf(tree)).toBe('Settings')

    await act(async () => {
      await i18n.changeLanguage('es-ES') // not seeded inline → loaded via RequireBackend
    })
    expect(textOf(tree)).toBe('Ajustes')
  })
})
