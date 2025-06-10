import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { View, GroupList, useTheme, Image } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { Space } from 'common/components/Space'
import {
  ServiceProviderCategories,
  ServiceProviders
} from 'services/meld/consts'
import { useSearchServiceProviders } from '../hooks/useSearchServiceProviders'
import { useOnRampServiceProvider } from '../store'

export const SelectServiceProviderScreen = (): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })
  const [_, setOnRampServiceProvider] = useOnRampServiceProvider()

  const dismiss = useCallback(() => {
    canGoBack() && back()
  }, [back, canGoBack])

  const data = useMemo(() => {
    if (!serviceProviders) return []

    return serviceProviders.map(serviceProvider => {
      return {
        title: ServiceProviders[serviceProvider.serviceProvider],
        onPress: () => {
          setOnRampServiceProvider(serviceProvider.serviceProvider)
          dismiss()
        },
        accessory: <></>,
        leftIcon: (
          <View
            style={{
              borderRadius: 100,
              overflow: 'hidden'
            }}>
            <Image
              accessibilityRole="image"
              sx={{ width: 27, height: 27 }}
              source={{
                uri: isDark
                  ? serviceProvider.logos.dark
                  : serviceProvider.logos.light
              }}
            />
          </View>
        )
      }
    })
  }, [dismiss, isDark, serviceProviders, setOnRampServiceProvider])

  return (
    <ScrollScreen
      isModal
      title="Change provider"
      subtitle="External providers are used to process fiat-to-crypto purchases. Rates vary between providers"
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ flex: 1 }}>
        <Space y={21} />
        <GroupList data={data} subtitleVariant="body1" />
      </View>
    </ScrollScreen>
  )
}
