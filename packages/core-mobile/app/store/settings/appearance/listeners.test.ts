// Inline mocks; read them back through the imports (no outer-var refs).
jest.mock('@vonovak/react-native-theme-control', () => ({
  setThemePreference: jest.fn()
}))
// listeners.ts imports onRehydrationComplete from 'store/app', which otherwise
// drags the whole store dependency graph into this unit test. Provide just the
// action creator (real createAction so isAnyOf's .match works).
jest.mock('store/app', () => ({
  onRehydrationComplete: require('@reduxjs/toolkit').createAction(
    'app/onRehydrationComplete'
  )
}))

import { setThemePreference } from '@vonovak/react-native-theme-control'
import { Appearance as RnAppearance } from 'react-native'
import { toggleDeveloperMode } from '../advanced'
import { addAppearanceListeners, handleAppearanceChange } from './listeners'
import { setSelectedAppearance, setSelectedColorScheme } from './slice'
import { Appearance, ColorSchemeName } from './types'

const apiWith = ({
  appearance,
  developerMode,
  colorScheme = 'light'
}: {
  appearance: Appearance
  developerMode: boolean
  colorScheme?: ColorSchemeName
  // Partial stand-in for AppListenerEffectAPI - the handler only touches
  // getState and dispatch, so widen rather than build the whole listener API.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => ({
  getState: () => ({
    settings: {
      appearance: { selected: appearance, colorScheme },
      advanced: { developerMode }
    }
  }),
  dispatch: jest.fn()
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyAction = { type: 'irrelevant' } as any

describe('handleAppearanceChange', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('native theme preference', () => {
    it.each([Appearance.System, Appearance.Light, Appearance.Dark])(
      'forces native dark in developer mode regardless of appearance (%s)',
      appearance => {
        // Regression guard for CP-15060. Developer mode forces the JS color
        // scheme to dark; if the native night mode is left on the user's own
        // appearance, Android draws native surfaces light under dark React
        // content - the formSheet modals showed a white header.
        const api = apiWith({ appearance, developerMode: true })
        handleAppearanceChange(anyAction, api)
        expect(setThemePreference).toHaveBeenCalledWith('dark')
      }
    )

    it.each([
      [Appearance.System, 'system'],
      [Appearance.Light, 'light'],
      [Appearance.Dark, 'dark']
    ])(
      'follows the user appearance when developer mode is off (%s)',
      (appearance, expected) => {
        const api = apiWith({
          appearance: appearance as Appearance,
          developerMode: false
        })
        handleAppearanceChange(anyAction, api)
        expect(setThemePreference).toHaveBeenCalledWith(expected)
      }
    )

    it('restores the user appearance when developer mode is turned back off', () => {
      handleAppearanceChange(
        anyAction,
        apiWith({ appearance: Appearance.Light, developerMode: true })
      )
      expect(setThemePreference).toHaveBeenLastCalledWith('dark')

      handleAppearanceChange(
        anyAction,
        apiWith({ appearance: Appearance.Light, developerMode: false })
      )
      expect(setThemePreference).toHaveBeenLastCalledWith('light')
    })
  })

  describe('js color scheme', () => {
    it('stays in step with the native preference in developer mode', () => {
      // The two layers disagreeing is the whole bug, so assert them together.
      const api = apiWith({
        appearance: Appearance.Light,
        developerMode: true,
        colorScheme: 'light'
      })
      handleAppearanceChange(anyAction, api)

      expect(setThemePreference).toHaveBeenCalledWith('dark')
      expect(api.dispatch).toHaveBeenCalledWith(setSelectedColorScheme('dark'))
    })

    it('does not dispatch when the color scheme is already correct', () => {
      const api = apiWith({
        appearance: Appearance.Light,
        developerMode: true,
        colorScheme: 'dark'
      })
      handleAppearanceChange(anyAction, api)

      expect(api.dispatch).not.toHaveBeenCalled()
    })

    it('resolves System from the OS when developer mode is off', () => {
      const spy = jest
        .spyOn(RnAppearance, 'getColorScheme')
        .mockReturnValue('dark')

      const api = apiWith({
        appearance: Appearance.System,
        developerMode: false,
        colorScheme: 'light'
      })
      handleAppearanceChange(anyAction, api)

      expect(api.dispatch).toHaveBeenCalledWith(setSelectedColorScheme('dark'))
      spy.mockRestore()
    })
  })
})

describe('addAppearanceListeners', () => {
  it('registers a listener that fires on appearance, developer mode and rehydration', () => {
    const startListening = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAppearanceListeners(startListening as any)

    const registered = startListening.mock.calls[0][0]
    expect(registered.matcher(setSelectedAppearance(Appearance.Dark))).toBe(
      true
    )
    // developer mode must re-run this, otherwise the native theme would stay
    // on the previous value until the user next touched the Theme setting
    expect(registered.matcher(toggleDeveloperMode())).toBe(true)
    expect(registered.matcher({ type: 'app/onRehydrationComplete' })).toBe(true)
    expect(registered.matcher({ type: 'some/other' })).toBe(false)
  })
})
