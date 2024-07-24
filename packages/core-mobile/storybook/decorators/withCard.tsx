import React from 'react'
import Card from 'components/Card'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withCard = (Story: any): React.JSX.Element => (
  <Card style={{ padding: 16, width: '100%' }}>
    <Story />
  </Card>
)
