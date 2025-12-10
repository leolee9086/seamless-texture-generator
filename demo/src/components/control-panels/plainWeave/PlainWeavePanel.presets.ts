import type { WeavePreset } from './PlainWeavePanel.types'

/**
 * 平纹织物预设配置
 */
export const WEAVE_PRESETS: Record<string, WeavePreset> = {
  'Cotton': {
    threadDensity: 20.0,
    threadThickness: 0.45,
    warpWeftRatio: 1.0,
    threadTwist: 0.5,
    fiberDetail: 0.3,
    fuzziness: 0.2,
    weaveTightness: 0.7,
    threadUnevenness: 0.15,
    weaveImperfection: 0.1,
    gradientStops: [
      { offset: 0.0, color: '#D4C8B8' },
      { offset: 1.0, color: '#F0E8DC' }
    ],
    warpSheen: 0.3,
    weftSheen: 0.25
  },
  'Linen': {
    threadDensity: 15.0,
    threadThickness: 0.55,
    warpWeftRatio: 1.1,
    threadTwist: 0.3,
    fiberDetail: 0.5,
    fuzziness: 0.1,
    weaveTightness: 0.6,
    threadUnevenness: 0.25,
    weaveImperfection: 0.2,
    gradientStops: [
      { offset: 0.0, color: '#B8AE9C' },
      { offset: 1.0, color: '#E8E0D0' }
    ],
    warpSheen: 0.4,
    weftSheen: 0.35
  },
  'Silk': {
    threadDensity: 30.0,
    threadThickness: 0.25,
    warpWeftRatio: 1.0,
    threadTwist: 0.7,
    fiberDetail: 0.1,
    fuzziness: 0.0,
    weaveTightness: 0.9,
    threadUnevenness: 0.05,
    weaveImperfection: 0.05,
    gradientStops: [
      { offset: 0.0, color: '#E8D8C8' },
      { offset: 1.0, color: '#FFF8F0' }
    ],
    warpSheen: 0.8,
    weftSheen: 0.75
  },
  'Canvas': {
    threadDensity: 12.0,
    threadThickness: 0.7,
    warpWeftRatio: 1.0,
    threadTwist: 0.4,
    fiberDetail: 0.4,
    fuzziness: 0.3,
    weaveTightness: 0.8,
    threadUnevenness: 0.2,
    weaveImperfection: 0.15,
    gradientStops: [
      { offset: 0.0, color: '#A89880' },
      { offset: 1.0, color: '#D8D0C0' }
    ],
    warpSheen: 0.1,
    weftSheen: 0.1
  }
}