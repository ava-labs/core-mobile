import { ImpactFeedbackStyle, impactAsync, selectionAsync } from 'expo-haptics'

// Tick-class pulse (UISelectionFeedbackGenerator on iOS, EFFECT_TICK on
// Android) — chainable for rapid picker/wheel feedback. Use this for
// per-step ticks; impactAsync would coalesce into a continuous buzz on
// Android at high firing rates.
export const fireSelectionHaptic = (): void => {
  selectionAsync().catch(() => undefined)
}

export const fireMinorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined)
}

export const fireMajorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Medium).catch(() => undefined)
}

export const fireEdgeHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Heavy).catch(() => undefined)
}
