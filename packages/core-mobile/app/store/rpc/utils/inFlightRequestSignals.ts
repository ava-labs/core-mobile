/**
 * Side-channel mapping an in-flight in-app request id (`String(data.id)`) to its
 * AbortSignal.
 *
 * Lets `ApprovalController` observe cancellation of the request whose approval
 * it has parked, so a programmatic cross-origin browser navigation can settle
 * the parked promise (and tear down Ledger BLE) instead of orphaning it.
 *
 * Why a side-channel and not a direct call / Redux subscription: the store
 * wiring transitively imports `ModuleManager` → `ApprovalController`, so the
 * controller can't import the store/listener middleware and `createInAppRequest`
 * can't import the controller without a require cycle. This module is a leaf
 * (imports nothing), so both sides can depend on it safely.
 *
 * Scope: only injected-provider signing requests pass an AbortSignal (the
 * browser router threads `controller.signal` into `requestSigning`), so only
 * those become cancellable here. WalletConnect and signal-less in-app approvals
 * register no signal and are untouched. (CP-14422)
 */
const requestSignals = new Map<string, AbortSignal>()

export const setRequestSignal = (
  requestId: string,
  signal: AbortSignal
): void => {
  requestSignals.set(requestId, signal)
}

export const getRequestSignal = (requestId: string): AbortSignal | undefined =>
  requestSignals.get(requestId)

export const clearRequestSignal = (requestId: string): void => {
  requestSignals.delete(requestId)
}
