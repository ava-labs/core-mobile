import React, { FC } from 'react'
import { FlatList, StyleProp, View, ViewStyle } from 'react-native'

interface Props {
  style: StyleProp<ViewStyle>
}

const ScrollViewList: FC<Props> = ({ style, children }) => {
  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListEmptyComponent={null}
      ListHeaderComponent={() => <View style={style}>{children}</View>}
    />
  )
}

export default ScrollViewList
