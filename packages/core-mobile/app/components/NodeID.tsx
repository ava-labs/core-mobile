import React from 'react'
import { copyToClipboard } from 'utils/DeviceTools'
import { Text } from '@avalabs/k2-mobile'
import { truncateNodeId } from 'utils/Utils'
import AvaButton from './AvaButton'
import CopySVG from './svg/CopySVG'

export const NodeID = ({ nodeID }: { nodeID: string }): JSX.Element => {
  return (
    <AvaButton.TextWithIcon
      textStyle={{ textAlign: 'left' }}
      onPress={() => copyToClipboard(nodeID)}
      icon={<CopySVG />}
      iconPlacement="left"
      text={
        <Text variant="buttonSmall" sx={{ color: '$neutral50' }}>
          {truncateNodeId(nodeID)}
        </Text>
      }
    />
  )
}
