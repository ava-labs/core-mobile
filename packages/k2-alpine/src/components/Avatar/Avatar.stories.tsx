import React, { useState } from 'react'
import { Switch } from 'react-native'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { AvatarSelector } from './AvatarSelector'
import { Avatar } from './Avatar'

export default {
  title: 'Avatar'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const [hasBlur, setHasBlur] = useState(true)

  const AVATARS = [
    require('../../assets/avatars/avatar-1.jpeg'),
    require('../../assets/avatars/avatar-2.jpeg'),
    require('../../assets/avatars/avatar-3.jpeg'),
    require('../../assets/avatars/avatar-4.jpeg'),
    require('../../assets/avatars/avatar-5.jpeg'),
    require('../../assets/avatars/avatar-6.png'),
    require('../../assets/avatars/avatar-7.png'),
    require('../../assets/avatars/avatar-8.png'),
    require('../../assets/avatars/avatar-9.jpeg'),
    {
      uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
    },
    {
      uri: 'https://www.cnet.com/a/img/resize/7589227193923c006f9a7fd904b77bc898e105ff/hub/2021/11/29/f566750f-79b6-4be9-9c32-8402f58ba0ef/richerd.png?auto=webp&width=768'
    },
    {
      uri: 'https://i.seadn.io/s/raw/files/a9cb8c2298a64819a3036083818d0447.jpg?auto=format&dpr=1&w=1000'
    },
    {
      uri: 'https://i.seadn.io/gcs/files/441e674e79460fc975d976465bb3634d.png?auto=format&dpr=1&w=1000'
    },
    {
      uri: 'https://www.svgrepo.com/show/19461/url-link.svg'
    }
  ].map((avatar, index) => {
    return { id: index.toString(), source: avatar }
  })

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(
    AVATARS[0]?.id
  )

  const handleSelect = (id: string): void => {
    setSelectedAvatarId(id)
  }

  const backgroundColor = theme.colors.$surfacePrimary

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor
      }}>
      <View sx={{ alignItems: 'flex-end', padding: 12 }}>
        <View
          sx={{
            gap: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Text>Blur on</Text>
          <Switch value={hasBlur} onValueChange={setHasBlur} />
        </View>
      </View>
      <View sx={{ alignItems: 'center', padding: 100 }}>
        <Avatar
          backgroundColor={backgroundColor}
          source={
            AVATARS.find(avatar => avatar.id === selectedAvatarId)?.source
          }
          size="large"
          hasBlur={hasBlur}
        />
      </View>
      <AvatarSelector
        selectedId={selectedAvatarId}
        avatars={AVATARS}
        onSelect={handleSelect}
      />
      <View sx={{ height: 200 }} />
    </ScrollView>
  )
}
