import warmup from '../../helpers/warmup'
import settingsLoc from '../../locators/settings.loc'
import settings from '../../pages/settings.page'

describe('Settings', () => {
  it('App icon - should have Default icon', async () => {
    await warmup()
    await settings.goSettings()
    await settings.verifySettingsRow(settingsLoc.appIcon, settingsLoc.default)
    await settings.tapAppIcon()
    await settings.verifyAppIconScreen(settingsLoc.core)
  })

  it('App icon - should change app icon', async () => {
    const newIcon = await settings.selectAppIcon()
    await settings.verifySettingsRow(settingsLoc.appIcon, newIcon)
    await settings.tapAppIcon()
    await settings.verifyAppIconScreen(newIcon)
  })
})
