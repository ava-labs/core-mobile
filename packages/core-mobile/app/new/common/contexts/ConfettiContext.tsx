import { ConfettiMethods } from '@avalabs/k2-alpine'
import { createContext, useContext } from 'react'

export const ConfettiContext = createContext<ConfettiMethods | null>(null)

export const useConfetti = (): ConfettiMethods => {
  const context = useContext(ConfettiContext)
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider')
  }
  return context
}
