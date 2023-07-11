import { useEffect, useMemo, useState } from 'react'

type WordSelection = {
  index: number
  wordOptions: string[]
}

export type UseCheckMnemonicData = {
  firstWordSelection: WordSelection
  secondWordSelection: WordSelection
  thirdWordSelection: WordSelection
  verify: (first: string, second: string, third: string) => boolean
}

export function useCheckMnemonic(mnemonic: string): UseCheckMnemonicData {
  const mnemonics = useMemo(() => mnemonic.split(' '), [mnemonic])
  const [firstWordSelection, setFirstWordSelection] = useState<WordSelection>({
    index: 0,
    wordOptions: []
  })
  const [secondWordSelection, setSecondWordSelection] = useState<WordSelection>(
    {
      index: 0,
      wordOptions: []
    }
  )
  const [thirdWordSelection, setThirdWordSelection] = useState<WordSelection>({
    index: 0,
    wordOptions: []
  })

  useEffect(() => {
    const pool = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23
    ]
    const indices = selectXRandNumbers(3, pool)

    const firstWordOptions = selectXRandWordsIncluding(
      indices[0] as number,
      3,
      pool,
      mnemonics
    )

    const secondWordOptions = selectXRandWordsIncluding(
      indices[1] as number,
      3,
      pool,
      mnemonics
    )

    const thirdWordOptions = selectXRandWordsIncluding(
      indices[2] as number,
      3,
      pool,
      mnemonics
    )

    setFirstWordSelection({
      index: indices[0] as number,
      wordOptions: firstWordOptions
    })
    setSecondWordSelection({
      index: indices[1] as number,
      wordOptions: secondWordOptions
    })
    setThirdWordSelection({
      index: indices[2] as number,
      wordOptions: thirdWordOptions
    })
  }, [mnemonics])

  const verify = (first: string, second: string, third: string) => {
    return (
      mnemonics[firstWordSelection.index] === first &&
      mnemonics[secondWordSelection.index] === second &&
      mnemonics[thirdWordSelection.index] === third
    )
  }

  return <UseCheckMnemonicData>{
    firstWordSelection,
    secondWordSelection,
    thirdWordSelection,
    verify
  }
}

function selectXRandNumbers(numOfNumbers: number, pool: number[]) {
  for (let i = 0; i < numOfNumbers; i++) {
    const randomIndex = Math.floor(Math.random() * (pool.length - i)) + i //pick random from pool
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ;[pool[i], pool[randomIndex]] = [pool[randomIndex]!, pool[i]!] //put it on front of pool
  }
  return pool.splice(0, numOfNumbers) //first [numOfNumbers] nums are now non-repeating random from pool and won't be duplicated
}

function selectXRandWordsIncluding(
  included: number,
  numOfNumbers: number,
  pool: number[],
  mnemonics: string[]
): string[] {
  const randoms = selectXRandNumbers(numOfNumbers, pool)
  const indexToRandomInject = Math.floor(Math.random() * numOfNumbers)
  randoms[indexToRandomInject] = included
  return randoms.map(wordIndex => mnemonics[wordIndex] as string)
}
