import actions from '../../helpers/actions'

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

  async verifySystemDisabledCard() {
    await actions.waitForElement(this.systemDisabledCardTitle)
    await actions.waitForElement(this.systemDisabledCardContent)
    await actions.waitForElement(this.systemDisabledCardButton)
  }
}

export default new Notifications()
