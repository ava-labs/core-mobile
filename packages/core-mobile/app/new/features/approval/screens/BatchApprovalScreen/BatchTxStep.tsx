import { NetworkTokenSymbols } from 'common/components/TokenIcon'
import { L2_NETWORK_SYMBOL_MAPPING } from 'consts/chainIdsWithIncorrectSymbol'
import { useSpendLimits } from 'hooks/useSpendLimits'
import React, { useEffect } from 'react'
import { Separator, View } from '@avalabs/k2-alpine'
import { SigningData_EthSendTx, SigningRequest } from '@avalabs/vm-module-types'
import { Account } from '../../components/Account'
import { Details } from '../../components/Details'
import { Network } from '../../components/Network'
import { SpendLimits } from '../../components/SpendLimits/SpendLimits'

// Renders a single transaction step within the batch approval stepper. This is
// split out from BatchApprovalScreen so `useSpendLimits` — which manages the
// per-tx editable spend limit — is called at a component top level rather than
// inside a loop over `signingRequests` (looping would violate
// react-hooks/rules-of-hooks).
export const BatchTxStep = ({
  index,
  signingRequest,
  disabled,
  onOverride
}: {
  index: number
  signingRequest: SigningRequest<SigningData_EthSendTx>
  disabled?: boolean
  onOverride: (
    index: number,
    encodedApproveCalldata: string | undefined
  ) => void
}): JSX.Element => {
  const { displayData } = signingRequest
  const chainId = displayData.network?.chainId

  const symbol = chainId
    ? (L2_NETWORK_SYMBOL_MAPPING[chainId] as NetworkTokenSymbols)
    : undefined

  const { spendLimits, canEdit, updateSpendLimit, hashedCustomSpend } =
    useSpendLimits(displayData.tokenApprovals)

  useEffect(() => {
    onOverride(index, hashedCustomSpend)
  }, [hashedCustomSpend, index, onOverride])

  return (
    <View style={{ gap: 12 }}>
      {spendLimits.length > 0 && (
        <SpendLimits
          spendLimits={spendLimits}
          onSelect={canEdit && !disabled ? updateSpendLimit : undefined}
        />
      )}
      {(displayData.account || displayData.network) && (
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12
          }}>
          {displayData.account && <Account address={displayData.account} />}
          {displayData.account && displayData.network && (
            <Separator sx={{ marginHorizontal: 16 }} />
          )}
          {displayData.network && (
            <Network
              logoUri={displayData.network.logoUri}
              symbol={symbol}
              name={displayData.network.name}
              chainId={chainId}
            />
          )}
        </View>
      )}
      {displayData.details.map((detailSection, sectionIndex) => (
        <Details
          key={sectionIndex}
          detailSection={detailSection}
          symbol={symbol}
        />
      ))}
    </View>
  )
}
