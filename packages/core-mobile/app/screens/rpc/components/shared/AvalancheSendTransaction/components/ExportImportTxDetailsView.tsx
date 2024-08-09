import React from 'react'
import { View, Text } from '@avalabs/k2-mobile'
import { ExportImportTxDetails } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import { isExportTx, isImportTx } from '@avalabs/avalanche-module'
import { ExportTxView } from './ExportTxView'
import { ImportTxView } from './ImportTxView'

export const ExportImportTxDetailsView = ({
  details
}: {
  details: ExportImportTxDetails
}): React.JSX.Element => {
  const renderDetails = (data: ExportImportTxDetails): React.JSX.Element => {
    if (isExportTx(data)) {
      return <ExportTxView tx={data} />
    }
    if (isImportTx(data)) {
      return <ImportTxView tx={data} />
    }
    throw new Error('Unsupported Transaction Type')
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="buttonMedium">Transaction Details</Text>
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
