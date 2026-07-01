import { useCallback, useState } from 'react'

// Tracks per-transaction spend-limit overrides for a batch approval: a map of
// txIndex -> re-encoded ERC-20 `approve` calldata (hex). The BatchApprovalScreen
// hands `overrides` to `onApprove`, and the ApprovalController applies each to
// the matching tx's calldata before signing. Passing `undefined` clears an index
// (revert to the default limit).
export const useSpendLimitOverrides = (): {
  overrides: Record<number, string>
  setOverride: (index: number, encodedApproveCalldata: string | undefined) => void
} => {
  const [overrides, setOverrides] = useState<Record<number, string>>({})

  const setOverride = useCallback(
    (index: number, encodedApproveCalldata: string | undefined) => {
      setOverrides(prev => {
        if (!encodedApproveCalldata) {
          if (!(index in prev)) return prev
          const next = { ...prev }
          delete next[index]
          return next
        }
        return { ...prev, [index]: encodedApproveCalldata }
      })
    },
    []
  )

  return { overrides, setOverride }
}
