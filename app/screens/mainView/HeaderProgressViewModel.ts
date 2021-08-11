import {useState} from 'react';

export type DotView = {
  filled: boolean;
};

export function useDots(maxDots: number, filledDots: number): [DotView[]] {
  const [pinDots] = useState<DotView[]>(getPinDots());

  function getPinDots(): DotView[] {
    const dots: DotView[] = [];
    for (let i = 0; i < maxDots; i++) {
      if (i < filledDots) {
        dots.push({filled: true});
      } else {
        dots.push({filled: false});
      }
    }
    return dots;
  }

  return [pinDots];
}
