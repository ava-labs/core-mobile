
---

## Post-plan revision (2026-07-21, after final review)

User decision during finishing: the History section must reuse `PositionListItem`
exactly as the full History screen renders it (coin logo, PnL pill, plain full-bleed
rows) instead of the Figma-exact GroupList rows built in Tasks 1 and 3. Applied as a
rework on the branch: `MarketHistory` now maps entries to `PositionListItem`, the
custom row sub-components were removed, and Task 1's k2-alpine `Icons.Content.Remove`
commit was reverted (nothing consumes it). Tasks 2, 4, and 5 are unaffected. The spec's
product decision #3 was updated accordingly.
