export type NavState = {
  routes?: Array<{ name?: string; state?: NavState }>
}

export function hasRouteByName(
  state: NavState | undefined,
  target: string
): boolean {
  if (!state?.routes) return false
  for (const r of state.routes) {
    if (r?.name === target) return true
    if (r?.state && hasRouteByName(r.state, target)) return true
  }
  return false
}
