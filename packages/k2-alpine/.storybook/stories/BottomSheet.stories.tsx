import React, { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { BottomSheet } from '../../src/components/BottomSheet'
import { View, Text, TouchableOpacity } from '../../src/components/Primitives'
import type BT from '@gorhom/bottom-sheet'

const BottomSheetMeta: Meta<typeof BottomSheet> = {
  title: 'BottomSheet',
  component: BottomSheet,
  args: {
    children: (
      <View>
        <Text>Bottom Sheet content</Text>
      </View>
    )
  }
}

export default BottomSheetMeta

export const Basic: StoryObj<typeof BottomSheet> = {}

const sheetRef = createRef<BT>()
export const WithRef: StoryObj<typeof BottomSheet> = {
  args: {
    sheetRef,
    children: (
      <View>
        <TouchableOpacity onPress={() => sheetRef.current?.close()}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    )
  }
}
