import React from 'react'

import { ScrollView, View, Text } from '../Primitives'
import Link from '../../utils/Link'
import { DividerLine } from './DividerLine'

export default {
  title: 'DividerLine'
}

export const All = (): JSX.Element => {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        flex: 1
      }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginBottom: 20 }}
      />
      <View>
        <Text>Regular</Text>
        <DividerLine />
      </View>
      <View>
        <Text>Prominent</Text>
        <DividerLine type={'prominent'} />
      </View>
    </ScrollView>
  )
}

const FIGMA_LINK =
  'https://www.figma.com/file/TAXtaoLGSNNt8nAqqcYH2H/K2-Component-Library?type=design&node-id=1596-32923&mode=design&t=jtcHUoKrPX76W8SZ-4'
