import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import {
  ConfettiMethods,
  PIConfetti,
  PIConfettiMethods
} from 'react-native-fast-confetti'
import { FullWindowOverlay } from 'react-native-screens'

export const Confetti = forwardRef<ConfettiMethods>((_, ref) => {
  const confettiRef = useRef<PIConfettiMethods>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const { width } = useWindowDimensions()

  const restart = useCallback(() => {
    setShowConfetti(true)
  }, [])

  useEffect(() => {
    if (showConfetti) {
      confettiRef.current?.restart()
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    }
  }, [showConfetti])

  useImperativeHandle(ref, () => ({
    restart,
    // we can't use these functions because the ref doesn't exist (this is because of showConfetti conditional)
    reset: () => confettiRef.current?.reset(),
    pause: () => confettiRef.current?.pause(),
    resume: () => confettiRef.current?.resume()
  }))

  const renderConfetti = useCallback(() => {
    return (
      <PIConfetti
        height={100}
        count={150}
        blastRadius={250}
        blastPosition={{ x: width / 2, y: 50 }}
        ref={confettiRef}
        fadeOutOnEnd={true}
        blastDuration={150}
        fallDuration={3000}
        flakeSize={{ width: 6, height: 12 }}
        colors={['#098F69', '#1FC626', '#42C49F']}
      />
    )
  }, [width])

  if (showConfetti) {
    return Platform.OS === 'ios' ? (
      <FullWindowOverlay>{renderConfetti()}</FullWindowOverlay>
    ) : (
      renderConfetti()
    )
  } else {
    return null
  }
})
