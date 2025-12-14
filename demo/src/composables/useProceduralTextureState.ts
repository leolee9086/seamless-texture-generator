import {
  reactive,
  watch,
  defaultWoodParams,
  defaultPlainWeaveAdvancedParams
} from './imports'
import type { ProceduralTextureState } from './useProceduralTextureState.types'
import { PROCEDURAL_STORAGE_KEY, TEXTURE_TYPES, TAB_NAMES, DEFAULT_COLORS, PROCEDURAL_STATE_ERRORS } from './constants'

// 默认状态
const defaultState: ProceduralTextureState = {
  activeTab: TAB_NAMES.UPLOAD,
  proceduralType: TEXTURE_TYPES.WOOD,
  woodParams: { ...defaultWoodParams },

  // 平纹织物默认参数 - legacy
  plainWeaveParams: {
    tileSize: 1.0,
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
      { offset: 0.0, color: DEFAULT_COLORS.PLAIN_WEAVE_WARP },
      { offset: 1.0, color: DEFAULT_COLORS.PLAIN_WEAVE_WEFT }
    ],
    warpSheen: 0.3,
    weftSheen: 0.25,
    fbmOctaves: 3,
    fbmAmplitude: 0.3,
    noiseFrequency: 2.0,
    colorVariation: 0.1,
    threadHeightScale: 1.0,
    threadShadowStrength: 0.5,
    normalStrength: 5.0,
    roughnessMin: 0.3,
    roughnessMax: 0.8
  },

  // Advanced Plain Weave Params
  plainWeaveAdvancedParams: { ...defaultPlainWeaveAdvancedParams },

  // 斜纹织物默认参数
  twillWeaveParams: {
    tileSize: 1.0,
    threadDensity: 40.0,
    threadThickness: 0.8,
    warpWeftRatio: 1.0,
    threadTwist: 0.7,
    fiberDetail: 0.4,
    fuzziness: 0.3,
    twillRepeat: 4.0,
    herringboneScale: 0.0,
    waleDepth: 1.2,
    weaveTightness: 0.85,
    threadUnevenness: 0.15,
    weaveImperfection: 0.1,
    gradientStops: [
      { offset: 0.0, color: DEFAULT_COLORS.TWILL_WEAVE_STOP_0 },
      { offset: 0.3, color: DEFAULT_COLORS.TWILL_WEAVE_STOP_1 },
      { offset: 0.6, color: DEFAULT_COLORS.TWILL_WEAVE_STOP_2 }
    ],
    warpSheen: 0.4,
    weftSheen: 0.25,
    roughnessMin: 0.5,
    roughnessMax: 0.9,
    normalStrength: 8.0,
    threadHeightScale: 1.2,
    threadShadowStrength: 0.6,
    fbmOctaves: 4,
    fbmAmplitude: 0.4,
    noiseFrequency: 3.0,
    colorVariation: 0.15
  },

  // 丝绒默认参数
  velvetParams: {
    tileSize: 1.0,
    fiberDensity: 30.0,
    fiberLength: 0.8,
    fiberThickness: 0.15,
    fiberStiffness: 0.3,
    pileHeight: 0.6,
    pileDirection: 0.0,
    sheenIntensity: 0.7,
    sheenDirection: 0.0,
    colorVariation: 0.1,
    gradientStops: [
      { offset: 0.0, color: DEFAULT_COLORS.VELVET_STOP_0 },
      { offset: 0.5, color: DEFAULT_COLORS.VELVET_STOP_1 },
      { offset: 1.0, color: DEFAULT_COLORS.VELVET_STOP_2 }
    ],
    roughnessMin: 0.1,
    roughnessMax: 0.9,
    normalStrength: 5.0
  },

  uiState: {
    woodPanel: {
      showColors: true,
      showBasicParams: true,
      showPoreParams: false,
      showAdvancedParams: false,
      showMaterialParams: false,
      showPresets: false
    },
    plainWeavePanel: {
      showColors: true,
      showBasicParams: true,
      showThreadParams: false,
      showAdvancedParams: false,
      showMaterialParams: false,
      showPresets: false
    },
    plainWeaveAdvancedPanel: {
      showColors: true,
      showBasicParams: true,
      showThreadParams: false,
      showAdvancedParams: false,
      showMaterialParams: false,
      showPresets: false
    },
    twillWeavePanel: {
      showColors: true,
      showBasicParams: true,
      showTwillParams: true,
      showThreadParams: false,
      showAdvancedParams: false,
      showMaterialParams: false,
      showPresets: false
    },
    velvetPanel: {
      showColors: true,
      showBasicParams: true,
      showFiberParams: false,
      showPileParams: false,
      showAdvancedParams: false,
      showMaterialParams: false,
      showPresets: false
    }
  }
}

// 从本地存储加载状态
function loadState(): ProceduralTextureState {
  try {
    const stored = localStorage.getItem(PROCEDURAL_STORAGE_KEY)
    if (!stored) {
      return { ...defaultState }
    }

    const parsedState = JSON.parse(stored)
    // 合并默认状态，确保新增的属性有默认值
    return {
      ...defaultState,
      ...parsedState,
      woodParams: { ...defaultState.woodParams, ...parsedState.woodParams },
      plainWeaveParams: { ...defaultState.plainWeaveParams, ...parsedState.plainWeaveParams },
      // Ensure plainWeaveAdvancedParams is correctly merged with defaults
      plainWeaveAdvancedParams: {
        ...defaultState.plainWeaveAdvancedParams,
        ...(parsedState.plainWeaveAdvancedParams || {})
      },
      twillWeaveParams: { ...defaultState.twillWeaveParams, ...parsedState.twillWeaveParams },
      velvetParams: { ...defaultState.velvetParams, ...parsedState.velvetParams },
      uiState: {
        woodPanel: { ...defaultState.uiState.woodPanel, ...parsedState.uiState?.woodPanel },
        plainWeavePanel: { ...defaultState.uiState.plainWeavePanel, ...parsedState.uiState?.plainWeavePanel },
        plainWeaveAdvancedPanel: {
          ...defaultState.uiState.plainWeaveAdvancedPanel,
          ...(parsedState.uiState?.plainWeaveAdvancedPanel || {})
        },
        twillWeavePanel: { ...defaultState.uiState.twillWeavePanel, ...parsedState.uiState?.twillWeavePanel },
        velvetPanel: { ...defaultState.uiState.velvetPanel, ...parsedState.uiState?.velvetPanel }
      }
    }

  } catch (error) {
    console.warn(PROCEDURAL_STATE_ERRORS.LOAD_FAILED, error)
    return { ...defaultState }
  }
}

/** @简洁函数 监听状态变化并自动保存 */
const saveState = (stateToSave: ProceduralTextureState): void => {
  try {
    localStorage.setItem(PROCEDURAL_STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.warn(PROCEDURAL_STATE_ERRORS.SAVE_FAILED, error)
  }
}

// 创建响应式状态
const state = reactive<ProceduralTextureState>(loadState())

// 监听状态变化并自动保存
watch(
  state,
  () => {
    saveState(state)
  },
  { deep: true }
)

/** @简洁函数 重置状态 */
const resetState = (): void => {
  Object.assign(state, defaultState)
  saveState(state)
}

// 参数重置映射
const resetHandlers: Record<string, () => void> = {
  [TEXTURE_TYPES.WOOD]: () => {
    state.woodParams = { ...defaultWoodParams }
  },
  [TEXTURE_TYPES.PLAIN_WEAVE]: () => {
    state.plainWeaveParams = { ...defaultState.plainWeaveParams }
  },
  [TEXTURE_TYPES.PLAIN_WEAVE_ADVANCED]: () => {
    state.plainWeaveAdvancedParams = { ...defaultPlainWeaveAdvancedParams }
  },
  [TEXTURE_TYPES.TWILL_WEAVE]: () => {
    state.twillWeaveParams = { ...defaultState.twillWeaveParams }
  },
  [TEXTURE_TYPES.VELVET]: () => {
    state.velvetParams = { ...defaultState.velvetParams }
  }
}

// 重置特定纹理类型的参数
const resetTextureParams = (textureType: string): void => {
  const handler = resetHandlers[textureType]
  if (!handler) {
    console.warn(`${PROCEDURAL_STATE_ERRORS.UNKNOWN_TYPE} ${textureType}`)
    return
  }
  handler()
}

// 导出状态和操作函数
export function useProceduralTextureState(): {
  state: ProceduralTextureState
  resetState: () => void
  resetTextureParams: (textureType: string) => void
} {
  return {
    state,
    resetState,
    resetTextureParams
  }
}