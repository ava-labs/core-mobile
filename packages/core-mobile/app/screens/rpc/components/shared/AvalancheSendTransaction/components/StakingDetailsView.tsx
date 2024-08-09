import React from 'react'
import { View, Text } from '@avalabs/k2-mobile'
import { StakingDetails as Details } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import {
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddSubnetValidatorTx,
  isRemoveSubnetValidatorTx
} from '@avalabs/avalanche-module'
import { AddDelegatorTxView } from './AddDelegatorTxView'
import { AddValidatorTxView } from './AddValidatorTxView'
import { RemoveSubnetValidatorTxView } from './RemoveSubnetValidatorTxView'
import { AddSubnetValidatorTxView } from './AddSubnetValidatorTxView'

export const StakingDetailsView = ({
  details
}: {
  details: Details
}): React.JSX.Element => {
  const renderDetails = (data: Details): React.JSX.Element => {
    if (isAddPermissionlessDelegatorTx(data)) {
      return <AddDelegatorTxView tx={data} />
    }
    if (isAddPermissionlessValidatorTx(data)) {
      return <AddValidatorTxView tx={data} />
    }
    if (isRemoveSubnetValidatorTx(data)) {
      return <RemoveSubnetValidatorTxView tx={data} />
    }
    if (isAddSubnetValidatorTx(data)) {
      return <AddSubnetValidatorTxView tx={data} />
    }
    throw new Error('Unsupported Transaction Type')
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="buttonMedium">Staking Details</Text>
      </Row>
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 16,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          backgroundColor: '$neutral800'
        }}>
        {renderDetails(details)}
      </View>
    </>
  )
}
