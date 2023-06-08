import React from 'react'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'

const queryCache = new QueryCache()
const queryClient = new QueryClient({
  queryCache: queryCache,
  defaultOptions: {
    queries: {
      staleTime: 10000
    }
  }
})

export const ReactQueryProvider: React.FC = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
