import { MIN_UPTIME_FOR_REWARDS } from './uptimeRequirement'

// Figma frames 23683:20049 / 23683:20461. The body has no trailing period.
export const LOW_UPTIME_ALERT_TITLE = 'Uptime too low'
export const LOW_UPTIME_ALERT_BODY = `This validator is below the ${MIN_UPTIME_FOR_REWARDS}% minimum uptime threshold and staking rewards may not be paid to delegators`
export const LOW_UPTIME_ALERT_CONTINUE = 'Continue'
export const LOW_UPTIME_ALERT_SELECT_NEW_NODE = 'Select a new node'
