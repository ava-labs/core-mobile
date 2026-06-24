import { DetailSection, RpcMethod, SigningData } from '@avalabs/vm-module-types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network/slice'
import { parseKnownTypedData } from 'features/approval/utils/eip712/parseKnownTypedData'
import { getTypedDataChainId } from 'features/approval/utils/eip712/getTypedDataChainId'

// EIP-712 signing methods whose payload we summarize (AC1) and inspect for a
// chain mismatch (AC2). eth_sign / personal_sign carry no typed domain.
const TYPED_DATA_METHODS: RpcMethod[] = [
  RpcMethod.SIGN_TYPED_DATA,
  RpcMethod.SIGN_TYPED_DATA_V1,
  RpcMethod.SIGN_TYPED_DATA_V3,
  RpcMethod.SIGN_TYPED_DATA_V4
]

type Eip712Insights = {
  // Human-readable summary for a recognized typed-data schema, or null.
  knownTypedDataSection: DetailSection | null
  // Non-blocking warning copy when the domain chainId != the active network.
  chainMismatchMessage: string | undefined
}

/**
 * Derives the EIP-712 UX enhancements for the approval screen from the signing
 * payload: a human-readable summary of well-known typed data (AC1) and a
 * chain-mismatch warning when the message's domain targets a network other than
 * the active one (AC2). Returns inert values for non-typed-data requests.
 */
export const useEip712Insights = (signingData: SigningData): Eip712Insights => {
  const { getNetwork } = useNetworks()
  const activeNetwork = useSelector(selectActiveNetwork)

  const data = 'data' in signingData ? signingData.data : undefined
  const isTypedData = TYPED_DATA_METHODS.includes(signingData.type)

  const knownTypedDataSection = useMemo(
    () => (isTypedData ? parseKnownTypedData(data)?.section ?? null : null),
    [isTypedData, data]
  )

  const chainMismatchMessage = useMemo(() => {
    if (!isTypedData) return undefined

    const domainChainId = getTypedDataChainId(data)
    if (domainChainId === undefined || domainChainId === activeNetwork.chainId)
      return undefined

    const name =
      getNetwork(domainChainId)?.chainName ?? `chain ID ${domainChainId}`
    return `This request is for ${name}, but your active network is ${activeNetwork.chainName}. Only sign if you trust this site.`
  }, [
    isTypedData,
    data,
    activeNetwork.chainId,
    activeNetwork.chainName,
    getNetwork
  ])

  return { knownTypedDataSection, chainMismatchMessage }
}
