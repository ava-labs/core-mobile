import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { PIConfetti, ConfettiMethods } from 'react-native-fast-confetti'

export const Confetti = forwardRef<ConfettiMethods>((_, ref) => {
  const confettiRef = useRef<ConfettiMethods>(null)

  const { width } = useWindowDimensions()

  useImperativeHandle(ref, () => ({
    restart: () => confettiRef.current?.restart(),
    reset: () => confettiRef.current?.reset(),
    pause: () => confettiRef.current?.pause(),
    resume: () => confettiRef.current?.resume()
  }))

  return (
    <PIConfetti
      count={150}
      blastRadius={250}
      blastPosition={{ x: width / 2, y: 50 }}
      ref={confettiRef}
      autoplay={false}
      fallDuration={2000}
      flakeSize={{ width: 6, height: 12 }}
      colors={['#098F69', '#1FC626', '#42C49F']}
    />
  )
})

export { type ConfettiMethods } from 'react-native-fast-confetti'
