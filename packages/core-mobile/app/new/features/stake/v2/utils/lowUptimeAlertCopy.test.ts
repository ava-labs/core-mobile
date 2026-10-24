import {
  LOW_UPTIME_ALERT_BODY,
  LOW_UPTIME_ALERT_CONTINUE,
  LOW_UPTIME_ALERT_SELECT_NEW_NODE,
  LOW_UPTIME_ALERT_TITLE
} from './lowUptimeAlertCopy'

describe('low uptime alert copy', () => {
  it('matches the Figma copy verbatim', () => {
    expect(LOW_UPTIME_ALERT_TITLE).toBe('Uptime too low')
    expect(LOW_UPTIME_ALERT_BODY).toBe(
      'This validator is below the 90% minimum uptime threshold and staking rewards may not be paid to delegators'
    )
    expect(LOW_UPTIME_ALERT_CONTINUE).toBe('Continue')
    expect(LOW_UPTIME_ALERT_SELECT_NEW_NODE).toBe('Select a new node')
  })

  it('derives the percentage in the body from MIN_UPTIME_FOR_REWARDS', () => {
    jest.isolateModules(() => {
      jest.doMock('./uptimeRequirement', () => ({
        MIN_UPTIME_FOR_REWARDS: 80
      }))
      const copy = require('./lowUptimeAlertCopy') as {
        LOW_UPTIME_ALERT_BODY: string
      }
      expect(copy.LOW_UPTIME_ALERT_BODY).toContain('below the 80% minimum')
    })
  })
})
