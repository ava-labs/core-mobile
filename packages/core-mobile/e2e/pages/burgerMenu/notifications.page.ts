import actions from '../../helpers/actions'
import delay from '../../helpers/waits'

class Notifications {
  get systemDisabledCardTitle() {
    return by.text('Allow Push Notifications')
  }

  get systemDisabledCardContent() {
    return by.text(
      'To start receiving notifications from Core, please turn on “Allow Notifications” in your device settings.'
    )
  }

  get systemDisabledCardButton() {
    return by.text('Open Device Settings')
  }

  async tapSystemDisabledCardButton() {
    await actions.tap(this.systemDisabledCardButton)
  }

  async tapNotificationSwitch(isSwitchOn = 'enabled', notiType = 'Stake') {
    const switchTestID = `${notiType}_${isSwitchOn}_switch`
    await actions.tap(by.id(switchTestID))
    await delay(300)
  }

  async toggleAndVerify(isSwitchOn = 'enabled', notiType: string) {
    const toggled = isSwitchOn === 'enabled' ? 'disabled' : 'enabled'
    await this.tapNotificationSwitch(isSwitchOn, notiType)
    await actions.waitForElement(by.id(`${notiType}_${toggled}_switch`))
  }

  async verifySystemDisabledCard() {
    await actions.waitForElement(this.systemDisabledCardTitle)
    await actions.waitForElement(this.systemDisabledCardContent)
    await actions.waitForElement(this.systemDisabledCardButton)
  }

  async verifyAllSwitches(isSwitchOn = 'enabled') {
    await actions.waitForElement(by.id(`Stake_${isSwitchOn}_switch`))
    await actions.waitForElement(by.id(`Balance_${isSwitchOn}_switch`))
    await actions.waitForElement(by.id(`Market News_${isSwitchOn}_switch`))
    await actions.waitForElement(by.id(`Price Alerts_${isSwitchOn}_switch`))
    await actions.waitForElement(
      by.id(`Product Announcements_${isSwitchOn}_switch`)
    )
    await actions.waitForElement(
      by.id(`Special Offers and Promotions_${isSwitchOn}_switch`)
    )
  }
}

export default new Notifications()
