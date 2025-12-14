import type { WeavePreset } from './PlainWeaveAdvancedPanel.types'


/**
 * 平纹织物预设配置
 */
export const WEAVE_PRESETS: Record<string, WeavePreset> = {
  'Cotton': {
    warpDensity: 20.0,
    weftDensity: 20.0,
    threadThickness: 0.45,
    threadTwist: 0.5,
    fiberDetail: 0.3,
    fuzziness: 0.2,
    weaveTightness: 0.7,
    threadUnevenness: 0.15,
    weaveImperfection: 0.1,
    warpColor: '#D4C8B8',
    weftColor: '#F0E8DC',
    warpSheen: 0.3,
    weftSheen: 0.25
  },
  'Linen': {
    warpDensity: 15.0,
    weftDensity: 15.0,
    threadThickness: 0.55,
    threadTwist: 0.3,
    fiberDetail: 0.5,
    fuzziness: 0.1,
    weaveTightness: 0.6,
    threadUnevenness: 0.25,
    weaveImperfection: 0.2,
    warpColor: '#B8AE9C',
    weftColor: '#E8E0D0',
    warpSheen: 0.4,
    weftSheen: 0.35
  },
  'Silk': {
    warpDensity: 30.0,
    weftDensity: 30.0,
    threadThickness: 0.25,
    threadTwist: 0.7,
    fiberDetail: 0.1,
    fuzziness: 0.0,
    weaveTightness: 0.9,
    threadUnevenness: 0.05,
    weaveImperfection: 0.05,
    warpColor: '#E8D8C8',
    weftColor: '#FFF8F0',
    warpSheen: 0.8,
    weftSheen: 0.75
  },
  'Canvas': {
    warpDensity: 12.0,
    weftDensity: 12.0,
    threadThickness: 0.7,
    threadTwist: 0.4,
    fiberDetail: 0.4,
    fuzziness: 0.3,
    weaveTightness: 0.8,
    threadUnevenness: 0.2,
    weaveImperfection: 0.15,
    warpColor: '#A89880',
    weftColor: '#D8D0C0',
    warpSheen: 0.1,
    weftSheen: 0.1
  }
}