import React, { FC, useMemo } from 'react'
import { FlatList, StyleProp, View, ViewStyle } from 'react-native'

interface Props {
  style: StyleProp<ViewStyle>
}

const ScrollViewList: FC<Props> = ({ style, children }) => {
  const Content = useMemo(
    () => <View style={style}>{children}</View>,
    [style, children]
  )

  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListEmptyComponent={null}
      ListHeaderComponent={Content}
    />
  )
}

export default ScrollViewList
