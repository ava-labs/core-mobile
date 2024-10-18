import actions from '../../helpers/actions'
import commonElsPage from '../commonEls.page'
import burgerMenuPage from './burgerMenu.page'

class Notifications {
  get stakeEnabledSwitch() {
    return by.id('Stake_enabled_switch')
  }

  get stakeDisabledSwitch() {
    return by.id('Stake_disabled_switch')
  }

  get balanceEnabledSwitch() {
    return by.id('Balance_enabled_switch')
  }

  get balanceDisabledSwitch() {
    return by.id('Balance_disabled_switch')
  }

  async tapStakeSwitch(on = true) {
    if (on) {
      await actions.tap(this.stakeDisabledSwitch)
    } else {
      await actions.tap(this.stakeEnabledSwitch)
    }
  }

  async tapBalanceSwitch(on = true) {
    if (on) {
      await actions.tap(this.balanceDisabledSwitch)
    } else {
      await actions.tap(this.balanceEnabledSwitch)
    }
  }

  async switchBalanceNotification(on = true) {
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapNotifications()
    await this.tapBalanceSwitch(on)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.dismissBurgerMenu()
  }

  async verifyNotificationsSwitches(stake: boolean, balance: boolean) {
    if (stake && balance) {
      // both switches are ON
      await actions.waitForElement(this.stakeEnabledSwitch)
      await actions.waitForElement(this.balanceEnabledSwitch)
    } else if (stake && !balance) {
      // only stake switch is ON
      await actions.waitForElement(this.stakeEnabledSwitch)
      await actions.waitForElement(this.balanceDisabledSwitch)
    } else if (!stake && balance) {
      // only balance switch is ON
      await actions.waitForElement(this.stakeDisabledSwitch)
      await actions.waitForElement(this.balanceEnabledSwitch)
    } else if (!stake && !balance) {
      // both switches are OFF
      await actions.waitForElement(this.stakeDisabledSwitch)
      await actions.waitForElement(this.balanceDisabledSwitch)
    }
  }
}

export default new Notifications()
