import React, { useState } from 'react'

import { useTheme, View } from '@avalabs/k2-mobile'
import { CreateChainTx } from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { StyleSheet } from 'react-native'
import Card from 'components/Card'
import Separator from 'components/Separator'

export const CreateChainTxView = ({
  tx
}: {
  tx: CreateChainTx
}): React.JSX.Element => {
  const { chainID, chainName, vmID, genesisData } = tx
  const [showGenesis, setShowGenesis] = useState(false)

  const {
    theme: { colors }
  } = useTheme()

  if (showGenesis) {
    return (
      <View>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => setShowGenesis(false)}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <AvaText.Heading1>Genesis Data</AvaText.Heading1>
        </Row>
        <Space y={16} />
        <View style={{ paddingVertical: 14 }}>
          <AvaText.Body1
            textStyle={{
              padding: 16,
              backgroundColor: colors.$neutral800,
              borderRadius: 15
            }}>
            {genesisData}
          </AvaText.Body1>
        </View>
      </View>
    )
  }

  return (
    <View>
      <AvaText.Body2 color={colors.$neutral50} textStyle={{ lineHeight: 20 }}>
        Blockchain Details
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
              Blockchain Name
            </AvaText.Caption>
          </Row>
          <Space y={4} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral50}>
              {chainName}
            </AvaText.Caption>
          </Row>
          <Space y={8} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral400}>
              Blockchain ID
            </AvaText.Caption>
          </Row>
          <Space y={4} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral50}>
              {chainID}
            </AvaText.Caption>
          </Row>
          <Space y={8} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral400}>
              Virtual Machine ID
            </AvaText.Caption>
          </Row>
          <Space y={4} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral50}>{vmID}</AvaText.Caption>
          </Row>
          <Separator style={styles.separator} color={colors.$neutral800} />
          <Row style={styles.rowContainer}>
            <AvaText.Caption color={colors.$neutral400}>
              Genesis File
            </AvaText.Caption>
          </Row>
          <Space y={4} />
          <Row style={styles.rowContainer}>
            <AvaButton.TextMedium
              style={{
                paddingHorizontal: 0,
                paddingVertical: 0
              }}
              onPress={() => setShowGenesis(true)}>
              View
            </AvaButton.TextMedium>
          </Row>
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
  },
  separator: {
    marginVertical: 16
  }
})
