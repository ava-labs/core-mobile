import { View } from '@avalabs/k2-mobile'
import { FC, PropsWithChildren } from 'react'
import React from 'react'

export const XpNetworkCardWrapper: FC<PropsWithChildren> = ({
  children
}): React.JSX.Element => {
  return (
    <View
      sx={{
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: '$neutral900',
        padding: 16,
        borderRadius: 8
      }}>
      {children}
    </View>
  )
}
