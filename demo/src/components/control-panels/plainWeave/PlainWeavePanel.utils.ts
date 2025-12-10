import { ref } from './imports'
import {
  generatePlainWeaveTexture
} from './imports'
import { DEBOUNCE_DELAY, TEXTURE_SIZE, PLAIN_WEAVE_PANEL_VALIDATION_ERRORS } from './PlainWeavePanel.constants'
import type { WeavePreset, PlainWeaveParams, DebouncedGenerateResult } from './PlainWeavePanel.types'
import { isValidPlainWeaveParamKey, isNumericPlainWeaveParamKey } from './PlainWeavePanel.guard'

/**
 * 处理平纹织物参数更新
 */
/**
 * 创建参数更新映射对象
 */
const createParamUpdaterMap = (): Record<string, (params: PlainWeaveParams, value: number) => void> => ({
  tileSize: (params: PlainWeaveParams, value: number): void => { params.tileSize = value },
  threadDensity: (params: PlainWeaveParams, value: number): void => { params.threadDensity = value },
  threadThickness: (params: PlainWeaveParams, value: number): void => { params.threadThickness = value },
  warpWeftRatio: (params: PlainWeaveParams, value: number): void => { params.warpWeftRatio = value },
  threadTwist: (params: PlainWeaveParams, value: number): void => { params.threadTwist = value },
  fiberDetail: (params: PlainWeaveParams, value: number): void => { params.fiberDetail = value },
  fuzziness: (params: PlainWeaveParams, value: number): void => { params.fuzziness = value },
  weaveTightness: (params: PlainWeaveParams, value: number): void => { params.weaveTightness = value },
  threadUnevenness: (params: PlainWeaveParams, value: number): void => { params.threadUnevenness = value },
  weaveImperfection: (params: PlainWeaveParams, value: number): void => { params.weaveImperfection = value },
  fbmOctaves: (params: PlainWeaveParams, value: number): void => { params.fbmOctaves = value },
  fbmAmplitude: (params: PlainWeaveParams, value: number): void => { params.fbmAmplitude = value },
  noiseFrequency: (params: PlainWeaveParams, value: number): void => { params.noiseFrequency = value },
  colorVariation: (params: PlainWeaveParams, value: number): void => { params.colorVariation = value },
  threadHeightScale: (params: PlainWeaveParams, value: number): void => { params.threadHeightScale = value },
  threadShadowStrength: (params: PlainWeaveParams, value: number): void => { params.threadShadowStrength = value },
  warpSheen: (params: PlainWeaveParams, value: number): void => { params.warpSheen = value },
  weftSheen: (params: PlainWeaveParams, value: number): void => { params.weftSheen = value },
  normalStrength: (params: PlainWeaveParams, value: number): void => { params.normalStrength = value },
  roughnessMin: (params: PlainWeaveParams, value: number): void => { params.roughnessMin = value },
  roughnessMax: (params: PlainWeaveParams, value: number): void => { params.roughnessMax = value }
})

/**
 * 更新单个参数值
 */
const updateSingleParam = (
  params: PlainWeaveParams,
  paramId: string,
  value: number
): boolean => {
  const paramUpdaterMap = createParamUpdaterMap()
  const updater = paramUpdaterMap[paramId]
  
  if (updater) {
    updater(params, value)
    return true
  }
  
  return false
}

/**
 * 处理平纹织物参数更新
 */
export const handleWeaveParamUpdate = (
  state: { plainWeaveParams: PlainWeaveParams },
  data: { id: string; value: number }
): void => {
  // 首先检查是否为有效的参数键，并且是数字类型的参数
  if (!isValidPlainWeaveParamKey(data.id) || !isNumericPlainWeaveParamKey(data.id)) {
    return
  }
  
  // 使用 Object.assign 来避免类型错误
  const updatedParams = { ...state.plainWeaveParams }
  
  // 尝试更新参数
  const updateSuccess = updateSingleParam(updatedParams, data.id, data.value)
  
  // 如果更新失败，记录警告
  if (!updateSuccess) {
    console.warn(PLAIN_WEAVE_PANEL_VALIDATION_ERRORS.INVALID_SLIDER_UPDATE, data.id)
    return
  }
  
  Object.assign(state.plainWeaveParams, updatedParams)
}

/**
 * 应用预设
 */
export const applyPreset = (
  state: { plainWeaveParams: PlainWeaveParams },
  preset: WeavePreset
): void => {
  Object.assign(state.plainWeaveParams, preset)
}

/**
 * 创建防抖生成函数
 */
export const createDebouncedGenerate = (
  generateCallback: () => Promise<void>
): DebouncedGenerateResult => {
  const pendingGeneration = ref(false)
  const localIsGenerating = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const debouncedGenerate = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      generateCallback()
    }, DEBOUNCE_DELAY)
  }

  const generate = async (): Promise<void> => {
    if (localIsGenerating.value) {
      pendingGeneration.value = true
      return
    }

    localIsGenerating.value = true

    try {
      do {
        pendingGeneration.value = false
        await generateCallback()
      } while (pendingGeneration.value)
    } catch (error) {
      console.error('Failed to generate weave texture:', error)
    } finally {
      localIsGenerating.value = false
    }
  }

  return {
    generate,
    debouncedGenerate,
    localIsGenerating
  }
}

/**
 * 创建平纹织物生成函数
 */
export const createPlainWeaveGenerator = (
  state: { plainWeaveParams: PlainWeaveParams },
  emit: (event: 'set-image', data: string) => void
): DebouncedGenerateResult => {
  const generateCallback = async (): Promise<void> => {
    const imageData = await generatePlainWeaveTexture(
      state.plainWeaveParams,
      TEXTURE_SIZE.WIDTH,
      TEXTURE_SIZE.HEIGHT
    )
    emit('set-image', imageData)
  }

  return createDebouncedGenerate(generateCallback)
}