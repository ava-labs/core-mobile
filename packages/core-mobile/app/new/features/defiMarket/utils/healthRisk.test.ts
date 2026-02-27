import { HEALTH_SCORE_CAUTION_COLOR } from '../consts'
import {
  formatHealthScore,
  getHealthRisk,
  getHealthRiskColor,
  HealthRisk
} from './healthRisk'

describe('getHealthRisk', () => {
  describe('HIGH risk (score < 1.25)', () => {
    it('should return HIGH for score 0', () => {
      expect(getHealthRisk(0)).toBe(HealthRisk.HIGH)
    })

    it('should return HIGH for score 1', () => {
      expect(getHealthRisk(1)).toBe(HealthRisk.HIGH)
    })

    it('should return HIGH for score 1.24', () => {
      expect(getHealthRisk(1.24)).toBe(HealthRisk.HIGH)
    })

    it('should return HIGH for score 1.249', () => {
      expect(getHealthRisk(1.249)).toBe(HealthRisk.HIGH)
    })
  })

  describe('MODERATE risk (1.25 <= score <= 3)', () => {
    it('should return MODERATE for score 1.25', () => {
      expect(getHealthRisk(1.25)).toBe(HealthRisk.MODERATE)
    })

    it('should return MODERATE for score 2', () => {
      expect(getHealthRisk(2)).toBe(HealthRisk.MODERATE)
    })

    it('should return MODERATE for score 3', () => {
      expect(getHealthRisk(3)).toBe(HealthRisk.MODERATE)
    })
  })

  describe('LOW risk (score > 3)', () => {
    it('should return LOW for score 3.01', () => {
      expect(getHealthRisk(3.01)).toBe(HealthRisk.LOW)
    })

    it('should return LOW for score 5', () => {
      expect(getHealthRisk(5)).toBe(HealthRisk.LOW)
    })

    it('should return LOW for score 100', () => {
      expect(getHealthRisk(100)).toBe(HealthRisk.LOW)
    })

    it('should return LOW for Infinity', () => {
      expect(getHealthRisk(Infinity)).toBe(HealthRisk.LOW)
    })
  })
})

describe('getHealthRiskColor', () => {
  const mockColors = {
    $textDanger: '#FF0000',
    $textSuccess: '#00FF00'
  }

  it('should return danger color for HIGH risk', () => {
    expect(
      getHealthRiskColor({ risk: HealthRisk.HIGH, colors: mockColors })
    ).toBe('#FF0000')
  })

  it('should return caution color for MODERATE risk', () => {
    expect(
      getHealthRiskColor({ risk: HealthRisk.MODERATE, colors: mockColors })
    ).toBe(HEALTH_SCORE_CAUTION_COLOR)
  })

  it('should return success color for LOW risk', () => {
    expect(
      getHealthRiskColor({ risk: HealthRisk.LOW, colors: mockColors })
    ).toBe('#00FF00')
  })
})

describe('formatHealthScore', () => {
  describe('undefined and invalid values', () => {
    it('should return "--" for undefined', () => {
      expect(formatHealthScore(undefined)).toBe('--')
    })

    it('should return "--" for NaN', () => {
      expect(formatHealthScore(NaN)).toBe('--')
    })
  })

  describe('infinity', () => {
    it('should return "∞" for Infinity', () => {
      expect(formatHealthScore(Infinity)).toBe('∞')
    })

    it('should return "∞" for negative Infinity', () => {
      expect(formatHealthScore(-Infinity)).toBe('∞')
    })
  })

  describe('large values (>= 100)', () => {
    it('should return rounded integer for score 100', () => {
      expect(formatHealthScore(100)).toBe('100')
    })

    it('should return rounded integer for score 150.7', () => {
      expect(formatHealthScore(150.7)).toBe('151')
    })

    it('should return rounded integer for score 999.4', () => {
      expect(formatHealthScore(999.4)).toBe('999')
    })
  })

  describe('normal values (< 100)', () => {
    it('should return one decimal place for score 0', () => {
      expect(formatHealthScore(0)).toBe('0.0')
    })

    it('should return one decimal place for score 1.5', () => {
      expect(formatHealthScore(1.5)).toBe('1.5')
    })

    it('should return one decimal place for score 2.34', () => {
      expect(formatHealthScore(2.34)).toBe('2.3')
    })

    it('should return one decimal place for score 99.99', () => {
      expect(formatHealthScore(99.99)).toBe('100.0')
    })

    it('should return one decimal place for score 50', () => {
      expect(formatHealthScore(50)).toBe('50.0')
    })
  })
})
