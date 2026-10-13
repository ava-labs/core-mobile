import React from 'react'
import { PerpsBadge } from './PerpsBadge'

/**
 * Small pill showing a HIP-3 market's builder-dex name (e.g. `xyz`). Rendered
 * next to the bare ticker so the dex isn't baked into the coin label as
 * `dex:TICKER`. Renders nothing for native (main-dex) markets.
 */
export const DexBadge = ({ dex }: { dex: string }): JSX.Element | null => {
  if (dex === '') {
    return null
  }
  return <PerpsBadge uppercase>{dex}</PerpsBadge>
}
