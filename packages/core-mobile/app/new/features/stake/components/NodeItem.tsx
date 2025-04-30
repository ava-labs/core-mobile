import React, { useMemo } from 'react'
import {
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { NodeValidator } from 'types/earn'
import { truncateNodeId } from 'utils/Utils'
import { format } from 'date-fns'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import NodeStable from '../../../assets/icons/node_stable.svg'
import NodeUnstable from '../../../assets/icons/node_unstable.svg'

export const NodeItem = ({
  node,
  onPress
}: {
  node: NodeValidator
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const endDate = useMemo(
    () => format(new Date(parseInt(node.endTime) * 1000), 'MM/dd/yy'),
    [node.endTime]
  )
  const shouldWarn = useMemo(() => Number(node.uptime) < 80, [node.uptime])

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18,
          paddingLeft: 16,
          paddingRight: 8,
          marginHorizontal: 16,
          marginBottom: 12,
          paddingVertical: 12,
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {shouldWarn ? <NodeUnstable /> : <NodeStable />}
          <View sx={{ gap: 2 }}>
            <Text variant="body1" sx={{ fontWeight: 600 }}>
              {truncateNodeId(node.nodeID)}
            </Text>
            <Text variant="body2">{`End date: ${endDate}`}</Text>
          </View>
        </View>
        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            sx={{
              color: shouldWarn ? '$textDanger' : '$textSecondary'
            }}>
            {formatNumber(node.uptime)}% uptime
          </Text>
          <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
        </View>
      </View>
    </AnimatedPressable>
  )
}
