import { warmup } from '../../helpers/warmup'
import sl from '../../locators/settings.loc'
import commonElsPage from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'

describe('Settings - Appearance', () => {
  it('should have system appereance by default', async () => {
    await warmup()
    await settingsPage.goSettings()
    await settingsPage.verifySettingsRow(sl.appearance, sl.system)
    await settingsPage.tapAppearanceRow()
    await settingsPage.verifyAppearanceScreen(sl.system, [sl.light, sl.dark])
  })

  it('should change appereance to light', async () => {
    await settingsPage.selectAppearance(sl.light)
    await settingsPage.verifyAppearanceScreen(sl.light, [sl.system, sl.dark])
    await commonElsPage.goBack()
    await settingsPage.verifySettingsRow(sl.appearance, sl.light + ' theme')
  })

  it('should change appereance to dark', async () => {
    await settingsPage.tapAppearanceRow()
    await settingsPage.selectAppearance(sl.dark)
    await settingsPage.verifyAppearanceScreen(sl.dark, [sl.system, sl.light])
    await commonElsPage.goBack()
    await settingsPage.verifySettingsRow(sl.appearance, sl.dark + ' theme')
  })
})
