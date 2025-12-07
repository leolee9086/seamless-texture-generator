import {  reactive, watch } from 'vue'
import { defaultWoodParams, type WoodParams } from '../proceduralTexturing/wood/woodGeneratorPipeline'

// 定义所有程序化纹理类型的参数接口
export interface ProceduralTextureState {
  // 通用状态
  activeTab: 'Upload' | 'Procedural'
  proceduralType: string
  
  // 木纹参数
  woodParams: WoodParams
  
  // 其他纹理参数（未来扩展）
  plainWeaveParams?: any
  leatherParams?: any
  twillWeaveParams?: any
  velvetParams?: any
  turingParams?: any
  grayScottParams?: any
  compositorParams?: any
  
  // UI 状态
  uiState: {
    woodPanel: {
      showColors: boolean
      showBasicParams: boolean
      showPoreParams: boolean
      showAdvancedParams: boolean
      showMaterialParams: boolean
      showPresets: boolean
    },
    plainWeavePanel?: any,
    leatherPanel?: any,
    twillWeavePanel?: any,
    velvetPanel?: any,
    turingPanel?: any,
    grayScottPanel?: any,
    compositorPanel?: any
  }
}

// 默认状态
const defaultState: ProceduralTextureState = {
  activeTab: 'Upload',
  proceduralType: 'Wood',
  woodParams: { ...defaultWoodParams },
  
  // 平纹织物默认参数
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
      { offset: 0.0, color: '#D4C8B8' },
      { offset: 1.0, color: '#F0E8DC' }
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
      { offset: 0.0, color: '#1a1a2e' },
      { offset: 0.3, color: '#e0e0d0' },
      { offset: 0.6, color: '#2c3e50' }
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
      { offset: 0.0, color: '#2a0845' },
      { offset: 0.5, color: '#5a3a7a' },
      { offset: 1.0, color: '#8a6a9a' }
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

// 本地存储键名
const STORAGE_KEY = 'procedural-texture-state'

// 从本地存储加载状态
const loadState = (): ProceduralTextureState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsedState = JSON.parse(stored)
      // 合并默认状态，确保新增的属性有默认值
      return {
        ...defaultState,
        ...parsedState,
        woodParams: {
          ...defaultState.woodParams,
          ...parsedState.woodParams
        },
        plainWeaveParams: {
          ...defaultState.plainWeaveParams,
          ...parsedState.plainWeaveParams
        },
        twillWeaveParams: {
          ...defaultState.twillWeaveParams,
          ...parsedState.twillWeaveParams
        },
        velvetParams: {
          ...defaultState.velvetParams,
          ...parsedState.velvetParams
        },
        uiState: {
          woodPanel: {
            ...defaultState.uiState.woodPanel,
            ...parsedState.uiState?.woodPanel
          },
          plainWeavePanel: {
            ...defaultState.uiState.plainWeavePanel,
            ...parsedState.uiState?.plainWeavePanel
          },
          twillWeavePanel: {
            ...defaultState.uiState.twillWeavePanel,
            ...parsedState.uiState?.twillWeavePanel
          },
          velvetPanel: {
            ...defaultState.uiState.velvetPanel,
            ...parsedState.uiState?.velvetPanel
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load procedural texture state from localStorage:', error)
  }
  return { ...defaultState }
}

// 保存状态到本地存储
const saveState = (state: ProceduralTextureState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save procedural texture state to localStorage:', error)
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

// 重置状态到默认值
const resetState = () => {
  Object.assign(state, defaultState)
  saveState(state)
}

// 重置特定纹理类型的参数
const resetTextureParams = (textureType: string) => {
  switch (textureType) {
    case 'Wood':
      state.woodParams = { ...defaultWoodParams }
      break
    case 'PlainWeave':
      state.plainWeaveParams = { ...defaultState.plainWeaveParams }
      break
    case 'TwillWeave':
      state.twillWeaveParams = { ...defaultState.twillWeaveParams }
      break
    case 'Velvet':
      state.velvetParams = { ...defaultState.velvetParams }
      break
    default:
      console.warn(`Unknown texture type: ${textureType}`)
  }
}

// 导出状态和操作函数
export function useProceduralTextureState() {
  return {
    state,
    resetState,
    resetTextureParams
  }
}