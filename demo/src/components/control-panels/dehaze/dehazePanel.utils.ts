import type { DehazePanelContext, ParamUpdateData } from './dehazePanel.types'
import { DEFAULT_DEHAZE_PARAMS, getDehazePreset, DehazeParams, DEHAZE_PRESETS, validateDehazeParams, createUpdateDataEvent } from './imports'
import { isValidDehazeParamKey } from './dehazeParams.guard'
import { INVALID_PARAM_KEY_WARNING_TEMPLATE, VALIDATION_FAILED_WARNING } from './dehazePanel.templates'
import { DEHAZE_CHANGE_EVENT, CONTROL_EVENT } from './dehazePanel.constants'

/**
 * 处理基础滑块更新
 * @param ctx 去雾面板上下文
 * @param data 更新数据
 */
export const handleBasicSliderUpdate = (
    ctx: DehazePanelContext,
    data: ParamUpdateData
): void => {
    // 卫语句：如果参数键无效，直接返回
    if (!isValidDehazeParamKey(data.id)) {
        console.warn(INVALID_PARAM_KEY_WARNING_TEMPLATE(data.id))
        return
    }

    const updates: Partial<DehazeParams> = {}

    // 使用卫语句扁平化逻辑
    if (data.id === 'omega') {
        updates.omega = data.value
    }
    if (data.id === 't0') {
        updates.t0 = data.value
    }
    if (data.id === 'windowSize') {
        updates.windowSize = Math.round(data.value / 2) * 2 + 1 // 确保为奇数
    }

    Object.assign(ctx.dehazeParams.value, updates)
    ctx.currentPreset.value = null
    emitDehazeChange(ctx)
}

/**
 * 处理高级滑块更新
 * @param ctx 去雾面板上下文
 * @param data 更新数据
 */
export const handleAdvancedSliderUpdate = (
    ctx: DehazePanelContext,
    data: ParamUpdateData
): void => {
    if (!isValidDehazeParamKey(data.id)) {
        console.warn(INVALID_PARAM_KEY_WARNING_TEMPLATE(data.id))
        return
    }

    const updates: Partial<DehazeParams> = {}

    if (data.id === 'topRatio') {
        updates.topRatio = data.value
    }
    if (data.id === 'adaptiveStrength') {
        updates.adaptiveStrength = data.value
    }
    if (data.id === 'hazeWeight') {
        updates.hazeWeight = data.value
    }
    if (data.id === 'atmosphericWeight') {
        updates.atmosphericWeight = data.value
    }

    Object.assign(ctx.dehazeParams.value, updates)
    ctx.currentPreset.value = null
    emitDehazeChange(ctx)
}

/**
 * 处理增强滑块更新
 * @param ctx 去雾面板上下文
 * @param data 更新数据
 */
export const handleEnhancementSliderUpdate = (
    ctx: DehazePanelContext,
    data: ParamUpdateData
): void => {
    if (!isValidDehazeParamKey(data.id)) {
        console.warn(INVALID_PARAM_KEY_WARNING_TEMPLATE(data.id))
        return
    }

    const updates: Partial<DehazeParams> = {}

    if (data.id === 'saturationEnhancement') {
        updates.saturationEnhancement = data.value
    }
    if (data.id === 'contrastEnhancement') {
        updates.contrastEnhancement = data.value
    }
    if (data.id === 'brightnessEnhancement') {
        updates.brightnessEnhancement = data.value
    }

    Object.assign(ctx.dehazeParams.value, updates)
    ctx.currentPreset.value = null
    emitDehazeChange(ctx)
}

/**
 * 应用预设
 * @param ctx 去雾面板上下文
 * @param presetKey 预设键
 */
export const applyPreset = (
    ctx: DehazePanelContext,
    presetKey: keyof typeof DEHAZE_PRESETS
): void => {
    ctx.dehazeParams.value = { ...getDehazePreset(presetKey) }
    ctx.currentPreset.value = presetKey
    emitDehazeChange(ctx)
}

/**
 * 重置去雾参数
 * @param ctx 去雾面板上下文
 */
export const resetDehaze = (ctx: DehazePanelContext): void => {
    ctx.dehazeParams.value = { ...DEFAULT_DEHAZE_PARAMS }
    ctx.currentPreset.value = null
    emitDehazeChange(ctx)
}

/**
 * 发射去雾变更事件
 * @param ctx 去雾面板上下文
 */
const emitDehazeChange = (ctx: DehazePanelContext): void => {
    const validation = validateDehazeParams(ctx.dehazeParams.value)
    if (!validation.isValid) {
        console.warn(VALIDATION_FAILED_WARNING, validation.errors)
        return
    }

    ctx.emit(CONTROL_EVENT, createUpdateDataEvent(DEHAZE_CHANGE_EVENT, { ...ctx.dehazeParams.value }))
}

/**
 * 获取预设显示名称
 * @param preset 预设键
 * @returns 本地化名称
 */
export const getPresetName = (preset: keyof typeof DEHAZE_PRESETS): string => {
    const names = {
        light: '轻度',
        medium: '中度',
        heavy: '重度',
        adaptive: '自适应',
        spatialAdaptive: '空间自适应',
        enhanced: '增强',
        default: '默认'
    }
    return names[preset] || preset
}