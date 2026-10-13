// Decides what the "You receive" field should show, given the current quote
// state. Extracted from SwapScreen so the recurring-vs-one-time branching is
// unit-testable without standing up the whole screen.
//
// Why this exists: in recurring mode the one-time `activeQuote` is deliberately
// frozen — `SwapScreen`'s `syncDebouncedAmount` early-returns when recurring is
// on, so `setAmount` never fires and `activeQuote` never refetches. The received
// amount must therefore come from the recurring quote's first-fill estimate
// (`recurringQuote.data.amountOut`) instead. Before this, `applyQuote` only ever
// read `activeQuote.amountOut`, so changing the pay amount with recurring on
// left the receive amount stuck at whatever it was when the toggle flipped on.

export type ReceiveAmountAction =
  | { type: 'set'; value: bigint }
  | { type: 'clear' }
  | { type: 'keep' }

export type ResolveReceiveAmountParams = {
  isRecurring: boolean
  // The entered pay amount (undefined = empty field).
  fromTokenValue: bigint | undefined
  // First-fill output estimate from the recurring quote (undefined while it
  // fetches or before frequency/orders are configured).
  recurringAmountOut: bigint | undefined
  // One-time quote presence + its output.
  hasActiveQuote: boolean
  activeQuoteAmountOut: bigint | undefined
  debouncedFromTokenValue: bigint | undefined
  // CCT recovery: an explicit 0 amount still yields a real amountOut to show.
  isCctRecovery: boolean
}

/**
 * Returns the action to apply to the "You receive" amount:
 *  - `set`   → overwrite with `value`
 *  - `clear` → reset to undefined (empty field / no quote)
 *  - `keep`  → leave the current value untouched (avoids flashing empty during
 *              a refetch when the fresh amountOut isn't in hand yet)
 */
export function resolveReceiveAmount({
  isRecurring,
  fromTokenValue,
  recurringAmountOut,
  hasActiveQuote,
  activeQuoteAmountOut,
  debouncedFromTokenValue,
  isCctRecovery
}: ResolveReceiveAmountParams): ReceiveAmountAction {
  if (isRecurring) {
    // No pay amount → nothing to receive.
    if (!fromTokenValue) return { type: 'clear' }
    // During a recurring-quote refetch `amountOut` is briefly undefined; keep
    // the prior value rather than flashing empty.
    if (recurringAmountOut) return { type: 'set', value: recurringAmountOut }
    return { type: 'keep' }
  }

  // One-time path — preserves the original applyQuote semantics exactly:
  // no quote or no amount (and not a CCT recovery) clears; otherwise set when
  // an amountOut is in hand, else keep the current value.
  if (!hasActiveQuote || (!debouncedFromTokenValue && !isCctRecovery)) {
    return { type: 'clear' }
  }
  if (activeQuoteAmountOut) return { type: 'set', value: activeQuoteAmountOut }
  return { type: 'keep' }
}
