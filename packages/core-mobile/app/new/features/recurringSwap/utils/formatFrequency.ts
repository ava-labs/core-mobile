import type { Frequency } from '../types'

const UNIT_LABEL: Record<Frequency['unit'], [string, string]> = {
  minute: ['minute', 'minutes'],
  hour: ['hour', 'hours'],
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months']
}

export function formatFrequency(f: Frequency | undefined): string {
  if (!f) return 'Set'
  const [singular, plural] = UNIT_LABEL[f.unit]
  return f.value === 1 ? `Every ${singular}` : `Every ${f.value} ${plural}`
}

export function formatFrequencyShort(f: Frequency): string {
  const [singular, plural] = UNIT_LABEL[f.unit]
  return f.value === 1 ? singular : `${f.value} ${plural}`
}
