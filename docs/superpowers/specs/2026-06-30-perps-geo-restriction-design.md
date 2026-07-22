# CP-14520 — Perps Geo-Restriction — Design

- **Ticket:** [CP-14520 — Perps - Geo Restriction UI screen](https://ava-labs.atlassian.net/browse/CP-14520)
- **Figma:** [Core Mobile Redesign 2025 — Details geo-restricted dark (node 22551-15646)](https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=22551-15643)
- **Help URL (per ticket):** `https://support.core.app/en/articles/15591330-core-mobile-what-are-perpetual-futures` (noted as "not currently published")
- **Date:** 2026-06-30

## 1. Summary

Perpetual Futures must be unavailable to users in geo-restricted locations. Today core-mobile gates
perps only behind PostHog flags (`selectIsPerpetualsBlocked` = `PERPETUALS && EVERYTHING`); there is **no**
geo detection of any kind.

This feature adds a runtime, IP-based availability check (mirroring core-web) and, when the user is
geo-blocked:

1. Keeps the perps **detail screen browsable** but replaces the bottom trade CTA with a warning row.
2. **Blocks trading** — the place-order screen disables submission, and the order submit performs a
   fresh re-check (VPN mitigation) and aborts if the user is now blocked.

Geo-restriction is **orthogonal** to the existing PostHog gating: the `PERPETUALS` flag controls whether
perps exists at all; the geo check controls whether trading is allowed within it.

## 2. Reference: how core-web does it

For parity, the source of truth is core-web (`ava-labs/core-web`, `apps/core/app/`):

- **`hooks/useFeatureAvailability.ts`** — `useQuery` hitting `GET ${PROXY_API_URL}/${feature}/available`.
  Only **HTTP 200** means available; any other status (403/404/5xx), failed fetch, or CORS error means
  **unavailable (fail-closed)**. The `queryFn` never throws (resolves `true`/`false`) so React Query never
  fails open. While pending, `isAvailable` is assumed `true` so the banner does not flash. `staleTime` is
  5 minutes, `retry: false`. `AvailabilityFeature = 'perps' | 'prediction-markets'`.
- **`PROXY_API_URL`** = `https://proxy-api.avax.network` (in `packages/constants`).
- **Gate composition** — `usePerpsInteractionEnabled` → `usePerpsTradingGate`, where
  `isGeoBlocked = !isPerpsAvailable`; trade form fields are disabled when blocked.
- **UI** — `PerpsUnavailableBanner.tsx`: a k2-alpine `Banner severity="error"` with copy
  *"Perpetual Futures may be restricted in your location due to local regulations."* and a "Learn more"
  action. (k2-alpine **mobile** has no `Banner` component, so mobile builds the row from primitives.)
- **VPN re-check** — core-web re-checks geoblock right before submitting a trade because the user may
  have toggled their VPN.

## 3. Design decisions (settled)

| Decision | Choice |
| --- | --- |
| Enforcement scope | **Detail-screen warning + block trade** (gate place-order route, disable Short/Long). Browsable but non-trading — matches core-web. |
| Geo signal source | **Mirror core-web endpoint now**: `GET {PROXY_API_URL}/perps/available`, same 200=allowed / fail-closed semantics. |
| Warning UI | **One-off in core-mobile** (no k2-alpine `Banner`); generalize later if prediction-markets reuses it. |
| Submit-time re-check | **Yes** — fresh, cache-bypassing availability fetch before order submit; abort + warn if blocked. |
| PostHog | **No change** — geo is orthogonal to `selectIsPerpetualsBlocked`. |

## 4. Architecture / data flow

```
useFeatureAvailability('perps')  ──fetch──▶  GET {PROXY_API_URL}/perps/available
        │  200 = allowed; any non-200 / network / CORS = blocked (fail-closed)
        │  while pending → assume available (no CTA flash, no false block)
        ▼
usePerpsAvailability() → { isGeoBlocked, isLoading }
        ├─▶ Detail footer: blocked → <PerpsGeoRestrictionWarning/> instead of SlidingButton
        ├─▶ Place-order: blocked → disable submit + show warning (route guard)
        └─▶ On submit: fresh re-fetch (bypass cache) → if blocked, abort
```

A single shared React Query key (`['featureAvailability', 'perps']`) means the 5-minute cache is reused
across the detail and place-order screens; only the submit-time re-check deliberately bypasses it.

## 5. Units (each small, single-purpose)

### 5.1 `app/new/common/hooks/useFeatureAvailability.ts` (new, generic)
Direct port of core-web's contract.

- Input: `feature: AvailabilityFeature` where `AvailabilityFeature = 'perps' | 'prediction-markets'`.
- `useQuery({ queryKey: ['featureAvailability', feature], staleTime: 5 * 60 * 1000, retry: false })`.
- `queryFn`: `try { const res = await fetch(\`${PROXY_API_URL}/${feature}/available\`, { signal }); return res.ok && res.status === 200 } catch { return false }` — never throws.
- Returns `{ isAvailable, isLoading, isError }` with `isAvailable = query.isPending ? true : query.data === true`.

### 5.2 `app/new/features/trade/perpetuals/hooks/usePerpsAvailability.ts` (new, thin wrapper)
- `const { isAvailable, isLoading } = useFeatureAvailability('perps')`
- Returns `{ isGeoBlocked: !isAvailable, isLoading }`.
- Keeps perps callers off the generic hook's shape; single place to evolve perps-specific behavior.

### 5.3 `app/new/features/trade/perpetuals/components/PerpsGeoRestrictionWarning.tsx` (new)
The Figma warning row (node 22551:27219):
- Error icon (danger) + text `$textDanger`, 15px medium:
  *"Perpetual Futures may be restricted in your location due to local regulations."*
- Small glass "Learn more" button → opens the ticket help URL via the app's URL-open utility.
- Sized to drop into the detail screen's footer slot (replaces the `SlidingButton`).

## 6. Integration edits

### 6.1 `PerpetualsDetailsScreen.tsx` — `renderFooter`
- Read `usePerpsAvailability()`.
- When `isGeoBlocked`, `renderFooter` returns `<PerpsGeoRestrictionWarning/>` instead of the
  `SlidingButton` (covers both the deposit and Short/Long footer states).
- While pending (`isAvailable` defaults `true`), the normal CTA renders — no warning flash.

### 6.2 `perpetualsPlaceOrder` screen — gate + submit re-check
- Disable the submit CTA when `isGeoBlocked` (route guard against deep links).
- **At submit**: perform a fresh availability fetch that bypasses the 5-minute cache (e.g.
  `queryClient.fetchQuery` with `staleTime: 0`, or an explicit invalidate-then-fetch). If the fresh
  result is blocked, abort the order and surface the geo warning. This closes the mid-session VPN-toggle gap.

### 6.3 Banner placement across the other perps surfaces (per Figma)
The same `PerpsGeoRestrictionWarning` row is rendered as a top-of-content banner (not a footer) on the
screens that have a header, matching the designs:
- **`PerpetualsScreen`** (Perps landing list, Trade tab — Figma `22551:29061` / `22551:15992`): in the
  list `renderHeader`, **after `<Positions>` and before `<TradeFilters>`** — i.e. below the header and any
  open positions, above the Trending/Volume/Change chips + Search. List stays browsable.
- **`PerpetualsBalanceScreen`** (Available balance sheet — Figma `22556:29496`): as the **first child of
  `ScrollScreen`**, below the "Available balance" header and above the "Withdrawable now" row.

Both are gated on `usePerpsAvailability().isGeoBlocked`. They are informational banners only; trade-blocking
is enforced at the place-order screen (§6.2). The detail screen (§6.1) keeps the warning in its footer/CTA
slot per Figma `22551:15646`.

## 7. Error handling

Fail-closed everywhere except the in-flight window:
- Non-200, network error, CORS, and `isError` all resolve to **blocked**.
- **Pending** resolves to **available**, so an allowed user never sees a flash of the warning, and is
  never momentarily blocked from trading while the check settles.

## 8. Testing

- **`useFeatureAvailability` unit:** 200 → available; 403/500 → blocked; `fetch` throws → blocked;
  pending → available (assumed).
- **`PerpsGeoRestrictionWarning`:** renders the danger copy; "Learn more" invokes the help URL.
- **Detail screen:** footer swaps warning ⇄ `SlidingButton` on `isGeoBlocked`; pending shows CTA.
- **Perps list screen:** header shows the banner when blocked, hides it otherwise.
- **Balance screen:** shows the banner when blocked, hides it otherwise.
- **Place-order:** submit disabled when blocked; submit aborts + warns when the fresh re-check returns blocked.

## 9. Open items / risks (tracked as plan tasks)

1. **Backend confirmation (blocking dependency):** confirm the mobile geo endpoint host + path
   (`proxy-api.avax.network/perps/available`) and that it is deployed. The whole feature keys off this.
2. **`PROXY_API_URL` constant:** locate the existing proxy base-URL constant in core-mobile config, or add
   one (core-web keeps it in `packages/constants`).
3. **Help URL** (`…15591330-core-mobile-what-are-perpetual-futures`) is "not currently published" per the
   ticket — the link will 404 until it goes live; we still ship the canonical URL.
4. The detail footer currently has a placeholder `HAS_BALANCE` constant gating deposit-vs-trade; the
   warning replaces whichever CTA would otherwise show.

## 10. Out of scope

- A reusable k2-alpine `Banner` component (revisit when prediction-markets needs geo-restriction).
- Geo-restriction for any feature other than perps (the hook is generic, but only `'perps'` is wired now).
- Hiding the Trade tab / perps entry points (the feature stays browsable by design).
