import React from 'react'
import { useTheme, View } from '@avalabs/k2-mobile'
import { CreateSubnetTx } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { StyleSheet } from 'react-native'
import Card from 'components/Card'

export const CreateSubnetTxView = ({
  tx
}: {
  tx: CreateSubnetTx
}): React.JSX.Element => {
  const { threshold, controlKeys } = tx

  const {
    theme: { colors }
  } = useTheme()

  return (
    <View>
      <AvaText.Body2 color={colors.$neutral50} textStyle={{ lineHeight: 20 }}>
        Subnet Details
      </AvaText.Body2>
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 16,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          backgroundColor: '$neutral800'
        }}>
        <Card>
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral400}>
              {controlKeys.length > 1 ? 'Owners' : 'Owner'}
            </AvaText.Caption>
          </Row>
          <Space y={4} />
          {controlKeys.map((controlKey, i) => (
            <Row style={styles.rowContainer} key={i}>
              <AvaText.Caption color={colors.$neutral50}>
                {controlKey}
              </AvaText.Caption>
            </Row>
          ))}
          <Space y={8} />
          {controlKeys.length > 1 && (
            <>
              <Row style={styles.rowContainer}>
                <AvaText.Caption color={colors.$neutral400}>
                  Signature Threshold
                </AvaText.Caption>
              </Row>
              <Space y={4} />
              <Row style={styles.rowContainer}>
                <AvaText.Caption color={colors.$neutral50}>
                  {threshold}/{controlKeys.length}
                </AvaText.Caption>
              </Row>
            </>
          )}
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
  }
})
