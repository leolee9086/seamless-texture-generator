import type { ClarityPanelContext, ParamUpdateData } from './clarityPanel.types'
import { DEFAULT_CLARITY_PARAMS, createClarityAdjustmentEvent, getClarityPreset, ClarityParams, CLARITY_PRESETS } from './imports'
import { isValidClarityParamKey } from './clarityParams.guard'
import { INVALID_PARAM_KEY_WARNING_TEMPLATE } from './clarityPanel.constants'
import { importParams } from './importParams'
import { exportParams } from './exportParams'

/**
 * 处理参数更新
 * @param ctx 清晰度面板上下文
 * @param data 更新数据
 */
export const handleParamUpdate = (
    ctx: ClarityPanelContext,
    data: ParamUpdateData
): void => {
    // 卫语句：如果参数键无效，直接返回
    if (!isValidClarityParamKey(data.id)) {
        console.warn(INVALID_PARAM_KEY_WARNING_TEMPLATE(data.id))
        return
    }

    const updates: Partial<ClarityParams> = {}
    updates[data.id] = data.value
    Object.assign(ctx.state.clarityParams.value, updates)

    // 清除当前预设
    ctx.state.currentPreset.value = null

    // 发送更新事件
    ctx.emit('controlEvent', createClarityAdjustmentEvent(ctx.state.clarityParams.value))
}

/**
 * 处理参数导入
 * @param ctx 清晰度面板上下文
 */
export const handleImportParams = (ctx: ClarityPanelContext): void => {
    importParams(ctx.state.clarityParams, ctx.state.currentPreset, ctx.emit)
}

/**
 * 处理参数导出
 * @param ctx 清晰度面板上下文
 */
export const handleExportParams = (ctx: ClarityPanelContext): void => {
    exportParams(ctx.state.clarityParams.value)
}

/**
 * 重置参数
 * @param ctx 清晰度面板上下文
 */
export const resetParams = (ctx: ClarityPanelContext): void => {
    ctx.state.clarityParams.value = { ...DEFAULT_CLARITY_PARAMS }
    ctx.state.currentPreset.value = null
    ctx.emit('controlEvent', createClarityAdjustmentEvent(ctx.state.clarityParams.value))
}

/**
 * 应用预设
 * @param ctx 清晰度面板上下文
 * @param presetKey 预设键
 */
export const applyPreset = (
    ctx: ClarityPanelContext,
    presetKey: keyof typeof CLARITY_PRESETS
): void => {
    ctx.state.clarityParams.value = { ...getClarityPreset(presetKey) }
    ctx.state.currentPreset.value = presetKey
    ctx.emit('controlEvent', createClarityAdjustmentEvent(ctx.state.clarityParams.value))
}