import { Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { NodeTag } from '../utils/determineNodeTags'

// Recommended / Reliable read as "positive" (green); Popular / New are neutral.
const POSITIVE_TAGS: ReadonlySet<NodeTag> = new Set(['Recommended', 'Reliable'])

/**
 * Marketing tag pill (Recommended / Popular / Reliable / New) shown on the
 * Delegate node row and the Node details header.
 */
export const NodeTagPill = ({ tag }: { tag: NodeTag }): JSX.Element => {
  const isPositive = POSITIVE_TAGS.has(tag)
  return (
    <View
      sx={{
        backgroundColor: isPositive ? '$textSuccess' : '$borderPrimary',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 5
      }}>
      <Text
        variant="buttonSmall"
        sx={{
          fontFamily: 'Inter-SemiBold',
          color: isPositive ? '$surfacePrimary' : '$textPrimary'
        }}>
        {tag}
      </Text>
    </View>
  )
}
