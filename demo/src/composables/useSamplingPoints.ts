import type { ImageObjRef } from './useSamplingPoints.types'
import { useSamplingPointsState } from './useSamplingPointsState.utils'
import { useSamplingPointsRotation } from './useSamplingPointsRotation.utils'
import { useSamplingPointsDrag } from './useSamplingPointsDrag.utils'
import { useSamplingPointsConfig } from './useSamplingPointsConfig.utils'

/**
 * @AIDONE 
 * [已修复] 原问题：
 * 1.初始化时图片没有居中 → resetView 现在使用 stage.position() 和 stage.scale() 实现居中
 * 2.滚轮缩放失效 → handleWheel 现在使用 stage.scale() 和 stage.position() 统一处理
 * 
 * 关键修改：统一使用 stage 进行缩放和平移（而非 groupConfig），这样 draggable stage + 滚轮缩放 能协调工作
 * 
 * 采样点管理的主composable
 * 整合状态、旋转、拖动和配置逻辑
 * @param imageObj 图片对象引用
 */
export function useSamplingPoints(imageObj: ImageObjRef) {
    // 状态管理
    const state = useSamplingPointsState(imageObj)

    // 旋转逻辑
    const rotationLogic = useSamplingPointsRotation({
        points: state.points,
        rotation: state.rotation,
        getLastRotation: state.getLastRotation,
        setLastRotation: state.setLastRotation
    })

    // 拖动逻辑
    const dragLogic = useSamplingPointsDrag({
        points: state.points,
        currentRatio: state.currentRatio,
        rotation: state.rotation,
        imageObj
    })

    // 配置计算
    const configLogic = useSamplingPointsConfig({
        points: state.points
    })

    return {
        // 状态
        points: state.points,
        ratios: state.ratios,
        currentRatio: state.currentRatio,
        rotation: state.rotation,
        midPoints: dragLogic.midPoints,

        // 方法
        resetPoints: state.resetPoints,
        setRatio: state.setRatio,
        handleRotationInput: rotationLogic.handleRotationInput,
        resetRotation: rotationLogic.resetRotation,
        handlePointDragMove: dragLogic.handlePointDragMove,
        handleRotatorDragMove: rotationLogic.handleRotatorDragMove,
        handleMidPointDragMove: dragLogic.handleMidPointDragMove,

        // 计算配置
        lineConfig: configLogic.lineConfig,
        rotationLineConfig: configLogic.rotationLineConfig,
        rotationHandleConfig: configLogic.rotationHandleConfig
    }
}