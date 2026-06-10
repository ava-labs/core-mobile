import { UTCDate } from '@date-fns/utc'
import { secondsToMilliseconds } from 'date-fns'

/**
 * Defensively parses the `stakeEndTime` route param into a `UTCDate`.
 *
 * The param arrives as a Unix-seconds string on the V2 stake flow's modal
 * routes. Callers historically did `new UTCDate(secondsToMilliseconds(
 * Number(param)))` which produces an Invalid Date when the param is
 * missing or non-numeric (deep links, backstack/state restoration, hot
 * reload, etc.) and then crashes later in `format(...)`.
 *
 * Returns `undefined` when the param is missing, empty, non-finite, or
 * non-positive so callers can fall back to a safe state (error surface,
 * dismiss-the-flow alert, etc.) instead of cascading a NaN through the
 * downstream date math.
 */
export const parseStakeEndTimeParam = (
  param: string | undefined
): UTCDate | undefined => {
  if (param === undefined || param === '') return undefined
  const seconds = Number(param)
  // Rejects NaN, ±Infinity, and 0 / negative (which would produce a date
  // at or before the Unix epoch and almost certainly indicates a bad param
  // rather than a legitimate stake end time).
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined
  return new UTCDate(secondsToMilliseconds(seconds))
}
