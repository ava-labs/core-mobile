import { View } from '@avalabs/k2-alpine'
import React from 'react'
import { AdvancedField, AdvancedFieldProps } from './AdvancedField'

export const AdvancedForm = ({
  data
}: {
  data: AdvancedFieldProps[]
}): React.JSX.Element => {
  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        width: '100%',
        borderRadius: 12
      }}>
      {data.map((item, index) => (
        <AdvancedField key={item.id} {...item} />
      ))}
    </View>
  )
}
